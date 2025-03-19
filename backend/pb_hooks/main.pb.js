//rezervace je ready
onRecordAfterUpdateSuccess(async (e) => {
  const record = e.record;
  if (
    record.getBool("active") &&
    record.getBool("ready") &&
    !record.getBool("notified")
  ) {
    try {
      await e.app.expandRecord(record, ["user", "book"]);

      const user = record.expandedOne("user");
      const book = record.expandedOne("book");

      if (!user || !book) {
        console.log("[HOOK] Přeskočeno – chybí user nebo book.");
        return;
      }

      const userEmail = user.getString("email");
      const userName = user.getString("name");
      const bookTitle = book.getString("name");

      const message = new MailerMessage({
        from: {
          address: e.app.settings().meta.senderAddress,
          name: e.app.settings().meta.senderName,
        },
        to: [{ address: userEmail }],
        subject: "Tvoje rezervace je připravená",
        html: `
          <p>Dobrý den,</p>
          <p>rezervace knihy <strong>${bookTitle}</strong>, kterou jste si zarezervoval(a), je nyní připravená k vyzvednutí.</p>
          <p>S pozdravem,<br />Systém knihovny</p>
        `,
      });

      await e.app.newMailClient().send(message);

      console.log(
        `[HOOK] E-mail odeslán pro uživatele ${userName} <${userEmail}> | Kniha: "${bookTitle}"`
      );

      record.set("notified", true);
      await e.app.save(record);
    } catch (err) {
      console.error(`[HOOK] Chyba při zpracování rezervace: ${err.message}`);
    }
  }
}, "reservations");

//upozornění na nevrácenou knihu
cronAdd("overdue_borrows_check", "0 9 * * 1", async () => {
  console.log("[TEST CRON] Spuštěno!");
  const now = new Date();

  let offset = 0;
  let hasMoreRecords = true;

  while (hasMoreRecords) {
    const overdueBorrows = await $app.findRecordsByFilter(
      "borrows",
      "return = false && to_date < {:now}",
      "",
      100,
      offset,
      { now: now.toISOString() }
    );

    if (overdueBorrows.length === 0) {
      console.log(
        `[CRON] Žádné nevrácené knihy ke kontrole (${now.toISOString()})`
      );
      break;
    }

    for (let borrow of overdueBorrows) {
      try {
        await $app.expandRecord(borrow, ["user", "book"]);

        const user = borrow.expandedOne("user");
        const book = borrow.expandedOne("book");

        if (!user || !book) {
          console.log(`[CRON] Přeskočen záznam – chybí user nebo book.`);
          continue;
        }

        const userEmail = user.getString("email");
        const userName = user.getString("name");
        const bookTitle = book.getString("name");
        let toDateStr = borrow.getString("to_date");

        const toDate = new Date(toDateStr);
        const formattedDate = `${toDate.getDate()}.${
          toDate.getMonth() + 1
        } ${toDate.getFullYear()}`;

        if (isNaN(toDate)) {
          console.log(
            `[CRON] Chyba: Invalid to_date value for book "${bookTitle}"`
          );
          continue;
        }

        const message = new MailerMessage({
          from: {
            address: $app.settings().meta.senderAddress,
            name: $app.settings().meta.senderName,
          },
          to: [{ address: userEmail }],
          subject: "Nevrácená kniha",
          html: `
                        <p>Dobrý den,</p>
                        <p>upozorňujeme Vás, že jste nevrátil(a) knihu <strong>${bookTitle}</strong>, která měla být vrácena dne <strong>${formattedDate}</strong>.</p>
                        <p>Prosíme o její co nejrychlejší vrácení.</p>
                        <p>S pozdravem,<br />Systém knihovny</p>
                    `,
        });

        await $app.newMailClient().send(message);
        console.log(
          `[CRON] Odeslán e-mail pro: ${userName} <${userEmail}> | Kniha: "${bookTitle}" | Termín vrácení: ${toDate.toISOString()}`
        );
      } catch (err) {
        console.error(`[CRON] Chyba při zpracování záznamu: ${err.message}`);
      }
    }

    offset += 100;

    hasMoreRecords = overdueBorrows.length === 100;
  }
});

//byla půjčena kniha pro uživatele
onRecordCreateRequest(async (e) => {
  const borrow = e.record;

  try {
    await e.app.expandRecord(borrow, ["user", "book"]);

    const user = borrow.expandedOne("user");
    const book = borrow.expandedOne("book");

    if (!user || !book) {
      console.log("[HOOK] Přeskočeno – chybí user nebo book.");
      return e.next();
    }

    const userEmail = user.getString("email");
    const bookTitle = book.getString("name");

    const formatDate = (d) =>
      `${d.getDate()}.${d.getMonth() + 1} ${d.getFullYear()}`;

    const fromDate = formatDate(new Date(borrow.getString("from_date")));
    const toDate = formatDate(new Date(borrow.getString("to_date")));

    const message = new MailerMessage({
      from: {
        address: e.app.settings().meta.senderAddress,
        name: e.app.settings().meta.senderName,
      },
      to: [{ address: userEmail }],
      subject: "Potvrzení o výpůjčce knihy",
      html: `
        <p>Dobrý den,</p>
        <p>potvrzujeme, že jste si právě vypůjčil(a) knihu <strong>${bookTitle}</strong>.</p>
        <p>Doba výpůjčky: <strong>${fromDate} – ${toDate}</strong>.</p>
        <p>Přejeme příjemné čtení!</p>
        <p><br />Systém knihovny</p>
      `,
    });

    await e.app.newMailClient().send(message);
    console.log(`[HOOK] E-mail odeslán pro výpůjčku uživatele <${userEmail}>`);
  } catch (err) {
    console.error(`[HOOK] Chyba při zpracování výpůjčky: ${err.message}`);
  }

  e.next();
}, "borrows");

//upozornění na blížící se termín vrácení knihy 
cronAdd("upcoming_due_borrows_check", "0 9 * * *", async () => {
  console.log("[CRON] Kontrola blížících se termínů vrácení knih...");

  const now = new Date();

  const upcomingDate = new Date(now);
  upcomingDate.setDate(now.getDate() + 3);

  const startDate = new Date(upcomingDate);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(upcomingDate);
  endDate.setHours(23, 59, 59, 999);

  console.log(
    `[CRON] Kontrola pro datum: ${upcomingDate.toISOString().split("T")[0]}`
  );

  let offset = 0;
  let hasMoreRecords = true;

  while (hasMoreRecords) {
    const upcomingBorrows = await $app.findRecordsByFilter(
      "borrows",
      "return = false && to_date >= {:startDate} && to_date <= {:endDate}",
      "",
      100,
      offset,
      {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }
    );

    if (upcomingBorrows.length === 0) {
      console.log("[CRON] Žádné výpůjčky s blížícím se termínem vrácení.");
      break;
    }

    for (let borrow of upcomingBorrows) {
      try {
        await $app.expandRecord(borrow, ["user", "book"]);

        const user = borrow.expandedOne("user");
        const book = borrow.expandedOne("book");

        if (!user || !book) {
          console.log("[CRON] Přeskočen záznam – chybí user nebo book.");
          continue;
        }

        const userEmail = user.getString("email");
        const userName = user.getString("name");
        const bookTitle = book.getString("name");

        const toDate = new Date(borrow.getString("to_date"));
        const formattedDate = `${toDate.getDate()}.${
          toDate.getMonth() + 1
        } ${toDate.getFullYear()}`;

        const message = new MailerMessage({
          from: {
            address: $app.settings().meta.senderAddress,
            name: $app.settings().meta.senderName,
          },
          to: [{ address: userEmail }],
          subject: "Blíží se termín vrácení knihy",
          html: `
            <p>Dobrý den,</p>
            <p>upozorňujeme Vás, že se blíží termín vrácení knihy <strong>${bookTitle}</strong>.</p>
            <p>Termín vrácení: <strong>${formattedDate}</strong>.</p>
            <p>Pokud jste knihu ještě nedočetl(a), zvažte její prodloužení nebo včasné vrácení.</p>
            <p>S pozdravem,<br />Systém knihovny</p>
          `,
        });

        await $app.newMailClient().send(message);
        console.log(
          `[CRON] Upozornění odesláno: ${userName} <${userEmail}> | Kniha: "${bookTitle}"`
        );
      } catch (err) {
        console.error(`[CRON] Chyba při zpracování výpůjčky: ${err.message}`);
      }
    }

    offset += 100;
    hasMoreRecords = upcomingBorrows.length === 100;
  }
});

//nová věc vě formu na požadavky
onRecordCreateRequest(async (e) => {
  try {
    const mailRecord = await $app.findRecordById("notification_mail", "1");

    if (!mailRecord) {
      console.log(
        "[HOOK] Záznam s ID '1' v tabulce 'notification_mail' nenalezen."
      );
      return e.next();
    }

    const recipientEmail = mailRecord.getString("email");

    const message = new MailerMessage({
      from: {
        address: $app.settings().meta.senderAddress,
        name: $app.settings().meta.senderName,
      },
      to: [{ address: recipientEmail }],
      subject: "Nový požadavek byl přidán",
      html: `
        <p>Dobrý den,</p>
        <p>byl vytvořen nový požadavek v systému.</p>
        <p>S pozdravem,<br />Systém knihovny</p>
      `,
    });

    await $app.newMailClient().send(message);

    console.log(
      `[HOOK] E-mail odeslán na adresu ${recipientEmail} (notification_mail.id = 1).`
    );
  } catch (err) {
    console.error(
      `[HOOK] Chyba při odesílání upozornění na nový požadavek: ${err.message}`
    );
  }

  e.next();
}, "requirements");

//nová recenze
onRecordCreateRequest(async (e) => {
  try {
    const mailRecord = await $app.findRecordById("notification_mail", "1");

    if (!mailRecord) {
      console.log(
        "[HOOK] Záznam s ID '1' v tabulce 'notification_mail' nenalezen."
      );
      return e.next();
    }

    const recipientEmail = mailRecord.getString("email");

    const message = new MailerMessage({
      from: {
        address: $app.settings().meta.senderAddress,
        name: $app.settings().meta.senderName,
      },
      to: [{ address: recipientEmail }],
      subject: "Nová recenze byla přidána",
      html: `
        <p>Dobrý den,</p>
        <p>byla vytvořena nová recenze v systému.</p>
        <p>S pozdravem,<br />Systém knihovny</p>
      `,
    });

    await $app.newMailClient().send(message);

    console.log(
      `[HOOK] E-mail odeslán na adresu ${recipientEmail} (notification_mail.id = 1).`
    );
  } catch (err) {
    console.error(
      `[HOOK] Chyba při odesílání upozornění na novou recenzi: ${err.message}`
    );
  }

  e.next();
}, "reviews");

//nová rezervacec
onRecordCreateRequest(async (e) => {
  try {
    const mailRecord = await $app.findRecordById("notification_mail", "1");

    if (!mailRecord) {
      console.log(
        "[HOOK] Záznam s ID '1' v tabulce 'notification_mail' nenalezen."
      );
      return e.next();
    }

    const recipientEmail = mailRecord.getString("email");

    const message = new MailerMessage({
      from: {
        address: $app.settings().meta.senderAddress,
        name: $app.settings().meta.senderName,
      },
      to: [{ address: recipientEmail }],
      subject: "Nová rezervace byla přidána",
      html: `
        <p>Dobrý den,</p>
        <p>byla vytvořena nová rezervace v systému.</p>
        <p>S pozdravem,<br />Systém knihovny</p>
      `,
    });

    await $app.newMailClient().send(message);

    console.log(
      `[HOOK] E-mail odeslán na adresu ${recipientEmail} (notification_mail.id = 1).`
    );
  } catch (err) {
    console.error(
      `[HOOK] Chyba při odesílání upozornění na novou rezervaci: ${err.message}`
    );
  }

  e.next();
}, "reservations");
