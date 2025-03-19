import React, { useState, useEffect } from "react";
import { Button, Modal, TextInput, Table, Loader } from "@mantine/core";
import { IconLock } from "@tabler/icons-react";
import pb from "../lib/pocketbase";
import "./style/About.css";

function About() {
  const [opened, setOpened] = useState(false);
  const [request, setRequest] = useState("");
  const [link, setLink] = useState("");
  const [locked, setLocked] = useState(!pb.authStore.isValid);
  const [schedule, setSchedule] = useState(null);
  const [isEvenWeek, setIsEvenWeek] = useState(null);
  const [loading, setLoading] = useState(true);

  Date.prototype.getWeekNumber = function () {
    const firstDayOfYear = new Date(this.getFullYear(), 0, 1);
    const pastDaysOfYear = (this - firstDayOfYear) / 86400000 + 1;
    return Math.ceil(pastDaysOfYear / 7);
  };

  const checkEvenWeek = () => {
    const currentWeek = new Date().getWeekNumber();
    return currentWeek % 2 === 0;
  };

  useEffect(() => {
    const handleAuthChange = () => {
      setLocked(!pb.authStore.isValid);
    };

    pb.authStore.onChange(handleAuthChange);

    const fetchData = async () => {
      setLoading(true);
      try {
        const record = await pb.collection("admin").getOne("wjonohaqmzn4uuk");
        setSchedule(record.data.library_schedule);
        setIsEvenWeek(checkEvenWeek());
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      pb.authStore.onChange(handleAuthChange);
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!locked) {
      const data = {
        request,
        link,
        user: pb.authStore.model.id,
      };

      try {
        const record = await pb.collection("requirements").create(data);
      } catch (error) {
        console.error("Error creating record:", error);
      }

      setOpened(false);
      setRequest("");
      setLink("");
    } else {
      alert("Pro posílání požadavků se přihlašte.");
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Loader color="orange" size="xl" className="loading" />
      </div>
    );
  }

  if (!schedule || isEvenWeek === null) {
    return <p>Chyba při načítání dat...</p>;
  }

  const weekType = isEvenWeek ? "even_week" : "odd_week";
  const openingHours = schedule[weekType].opening_hours;

  const dayOrder = [
    "pondělí",
    "úterý",
    "středa",
    "čtvrtek",
    "pátek",
    "sobota",
    "neděle",
  ];

  return (
    <div className="about">
      <div>
        <h1>Informace o knihovně</h1>
        <p>
          Knihovna je otevřena všem studentům a zaměstnancům školy. Nabízíme
          široký výběr knih, učebnic, časopisů a dalších materiálů, které můžete
          využít k vlastnímu studiu nebo volnému čtení. Knihovna je také místem
          odpočinky a relaxace, k čemuž slouží gauč nebo sedací pytle.
        </p>
        <p>
          Pro využívání služeb knihovny je nutné dodržovat pravidla a pokyny. V
          případě jakýchkoliv dotazů nebo problémů se obraťte na knihovníka nebo
          jiného zaměstnance školy. Knihovna je otevřená podle níže uvedeného
          rozvrhu.
        </p>
      </div>

      <div>
        <h2>Jak funguje pujčování knížek</h2>
        <p>
          {" "}
          Poté co si vyberete knížku co si chcete půjčit ji donesete za paní
          učitelkou Benešovou které ji zadá do systému. Musíte mít vytvořený
          účet na školní mail. Po přihlášení uvidíte všechny knížky které jste
          si půjčili a jejich termín vrácení a také si můžete rezervovat knížku
          která je momentálně půjčená.{" "}
        </p>
      </div>

      <div className="library-schedule">
        <b>{isEvenWeek ? "Sudý týden" : "Lichý týden"}</b>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ textAlign: "center" }}>Den</Table.Th>
              <Table.Th style={{ textAlign: "center" }}>Otevřeno</Table.Th>
              <Table.Th style={{ textAlign: "center" }}>Zavřeno</Table.Th>
              <Table.Th style={{ textAlign: "center" }}>Dozor</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {Object.entries(openingHours)
              .sort(
                ([dayA], [dayB]) =>
                  dayOrder.indexOf(dayA.toLowerCase()) -
                  dayOrder.indexOf(dayB.toLowerCase())
              )
              .map(([day, details]) => (
                <Table.Tr key={day}>
                  <Table.Td>{day}</Table.Td>
                  <Table.Td>{details.open}</Table.Td>
                  <Table.Td>{details.close}</Table.Td>
                  <Table.Td>{details.supervision}</Table.Td>
                </Table.Tr>
              ))}
          </Table.Tbody>
        </Table>
      </div>

      <div className={`req-div ${locked ? "locked" : ""}`}>
        {locked && (
          <div className="overlay">
            <IconLock size={50} />
            <p>Pro posílaní požadavků se přihlašte</p>
          </div>
        )}
        <h3>Chybí vám něco v knihovně?</h3>
        <p>
          Máte pocit, že v naší knihovně chybí kniha, časopis nebo jiný
          materiál, který byste rádi využili? Dejte nám vědět! Vyplňte prosím
          následující formulář a my se pokusíme váš požadavek co nejdříve
          splnit.
        </p>
        <Button color="#df3f1b" onClick={() => !locked && setOpened(true)}>
          Poslat žádost
        </Button>
      </div>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Požadavek na nákup"
      >
        <form onSubmit={handleSubmit}>
          <TextInput
            label="Požadavek"
            value={request}
            onChange={(event) => setRequest(event.currentTarget.value)}
            required
          />
          <TextInput
            label="Odkaz"
            value={link}
            onChange={(event) => setLink(event.currentTarget.value)}
          />
          <Button type="submit" color="#df3f1b" mt="md">
            Odeslat
          </Button>
        </form>
      </Modal>
    </div>
  );
}

export default About;
