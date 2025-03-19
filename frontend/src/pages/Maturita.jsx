import { useEffect, useState } from "react";
import { Table, Loader, Text, Checkbox, Button, Badge } from "@mantine/core";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import pb from "../lib/pocketbase";
import "./style/Maturita.css";
import amiriFont from '../font.js';
import { IconDownload } from "@tabler/icons-react";

const CATEGORY_REQUIREMENTS = {
  "Světová a česká literatura do konce 18. století": 2,
  "Světová a česká literatura 19. století": 3,
  "Světová literatura 20. a 21. století": 4,
  "Česká literatura 20. a 21. století": 5,
};

const FORM_REQUIREMENTS = {
  drama: 2,
  poezie: 2,
  próza: 2,
};

const getCurrentSchoolYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  if (month >= 8) {
    return `${year + 1}`;
  } else {
    return `${year}`;
  }
};

const Maturita = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooks, setSelectedBooks] = useState(new Set());
  const [studentName, setStudentName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [schoolYear, setSchoolYear] = useState(getCurrentSchoolYear());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedRecords = await pb
          .collection("graduation_reading_list")
          .getFullList({ sort: "id" });
        setRecords(fetchedRecords);

        const savedSelection = localStorage.getItem("selectedBooks");
        if (savedSelection) {
          const parsed = JSON.parse(savedSelection);
          setSelectedBooks(new Set(parsed));
        }
      } catch (error) {
        console.error("Chyba při načítání dat:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (selectedBooks.size === 0) {
      return;
    }
    localStorage.setItem(
      "selectedBooks",
      JSON.stringify(Array.from(selectedBooks))
    );
  }, [selectedBooks]);

  const clearSelection = () => {
    setSelectedBooks(new Set());
    localStorage.removeItem("selectedBooks");
  };

  const toggleSelection = (id) => {
    setSelectedBooks((prev) => {
      const newSelection = new Set(prev);
      newSelection.has(id) ? newSelection.delete(id) : newSelection.add(id);
      return newSelection;
    });
  };

  const groupedRecords = records.reduce((acc, book) => {
    if (!acc[book.type]) {
      acc[book.type] = [];
    }
    acc[book.type].push(book);
    return acc;
  }, {});

  let totalSelected = 0;

  const isNameValid = studentName.trim().split(/\s+/).length >= 2;
  const isSchoolYearValid = /^\d{4}$/.test(schoolYear.trim());
  const isFormFilled =
    studentName.trim() !== "" &&
    studentClass.trim() !== "" &&
    schoolYear.trim() !== "" &&
    isNameValid &&
    isSchoolYearValid;

  const getValidationMessages = () => {
    let messages = [];

    totalSelected = 0;

    for (const [category, minCount] of Object.entries(CATEGORY_REQUIREMENTS)) {
      const selectedCount =
        groupedRecords[category]?.filter((book) => selectedBooks.has(book.id))
          .length || 0;

      if (selectedCount < minCount) {
        messages.push(
          `❌ Kategorie "${category}" musí mít alespoň ${minCount} knih (vybráno: ${selectedCount})`
        );
      } else {
        messages.push(
          `✅ Kategorie "${category}" splněna (vybráno: ${selectedCount})`
        );
      }

      totalSelected += selectedCount;
    }

    if (totalSelected !== 20) {
      messages.push(
        `❌ Celkový počet knih musí být přesně 20 (aktuálně: ${totalSelected})`
      );
    } else {
      messages.push(`✅ Celkový počet knih je správný (20 knih)`);
    }

    const selectedForms = {
      drama: 0,
      poezie: 0,
      próza: 0,
    };

    records.forEach((book) => {
      if (
        selectedBooks.has(book.id) &&
        selectedForms.hasOwnProperty(book.form)
      ) {
        selectedForms[book.form]++;
      }
    });

    for (const [form, minCount] of Object.entries(FORM_REQUIREMENTS)) {
      if (selectedForms[form] < minCount) {
        messages.push(
          `❌ Musíte vybrat alespoň ${minCount} knihy z formy "${form}" (vybráno: ${selectedForms[form]})`
        );
      } else {
        messages.push(
          `✅ Počet knih z formy "${form}" je v pořádku (vybráno: ${selectedForms[form]})`
        );
      }
    }

    // 👉 Nová validace: max 2 knihy od jednoho autora
    const authorCountMap = {};

    records.forEach((book) => {
      if (selectedBooks.has(book.id)) {
        if (!authorCountMap[book.author_name]) {
          authorCountMap[book.author_name] = 0;
        }
        authorCountMap[book.author_name]++;
      }
    });

    const authorsOverLimit = Object.entries(authorCountMap).filter(
      ([_, count]) => count > 2
    );

    if (authorsOverLimit.length > 0) {
      authorsOverLimit.forEach(([author, count]) => {
        messages.push(
          `❌ Autor "${author}" má vybráno ${count} knih – maximum je 2`
        );
      });
    } else {
      messages.push("✅ Počet knih od každého autora je v pořádku (max 2)");
    }

    return messages;
  };

  const validationMessages = getValidationMessages();
  const isValidSelection = validationMessages.every((msg) =>
    msg.startsWith("✅")
  );


  const exportToPDF = () => {
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();

    doc.addFileToVFS("Amiri-Regular.ttf", amiriFont);
    doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
    doc.setFont("Amiri");

    doc.setLanguage("cs");

    doc.setFontSize(10);
    doc.text(
      "Střední průmyslová škola, Ústí nad Labem, Resslova 5, příspěvková organizace",
      pageWidth / 2,
      10,
      { align: "center" }
    );
    doc.setFontSize(8);
    doc.text("Středisko Stříbrníky, Výstupní 2, 400 11", pageWidth / 2, 15, {
      align: "center",
    });

    doc.setFontSize(12);
    doc.text("ZÁVAZNÝ VÝBĚR DĚL pro ústní část MZ z ČJL", pageWidth / 2, 30, {
      align: "center",
    });

    doc.setFontSize(10);
    doc.text(`JMÉNO: ${studentName}`, 14, 40);
    doc.text(`TŘÍDA: ${studentClass}`, 100, 40);
    doc.text(`ŠKOLNÍ ROK: ${schoolYear}`, 150, 40);

    let startY = 45;
    let rowIndex = 1;

    Object.entries(groupedRecords).forEach(([type, books]) => {
      const filteredBooks = books.filter((book) => selectedBooks.has(book.id));

      if (filteredBooks.length === 0) return;

      doc.setFontSize(10);
      doc.text(type, pageWidth / 2, startY + 5, { align: "center" });

      autoTable(doc, {
        head: [["#", "id", "Autor", "Dílo", "lit. forma"]],
        body: filteredBooks.map((book) => [
          rowIndex++,
          book.id,
          book.author_name,
          book.book_name,
          book.form,
        ]),
        startY: startY + 10,
        theme: "grid",
        styles: {
          fontSize: 8,
          font: "Amiri",
          textColor: [0, 0, 0],
          lineColor: [0, 0, 0],
          lineWidth: 0.3,
        },
        headStyles: { fillColor: [256, 256, 256], textWidth: 10 },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 10 },
          2: { cellWidth: 70 },
          3: { cellWidth: 70 },
          4: { cellWidth: 25 },
        },
      });

      startY = doc.lastAutoTable.finalY + 5;
    });

    let signatureY = startY + 10;
    doc.setFontSize(10);
    doc.text("Podpis:", pageWidth / 2 + 20, signatureY, { align: "center" });
    doc.line(pageWidth / 2 + 30, signatureY, pageWidth / 2 + 70, signatureY);

    doc.save("maturita_seznam.pdf");
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Loader color="orange" size="xl" className="loading" />
      </div>
    );
  }

  return (
    <>
      <div className="maturita-err">
        <p>
          Formulář pro výběr maturitní četby nelze zobrazit na takto malém
          displeji. Použijte prosím větší obrazovku.
        </p>
      </div>

      <div className="maturita-page">
        <div className="maturita-choice">
          <div className="student-info-form" style={{ marginBottom: "20px" }}>
            <Text size="xl" mb={10} weight={600}>
              Údaje pro export:
            </Text>
            <div className="student-info">
              <div className="student-info-box">
                <label for="studentName">Jméno studenta:</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Jméno studenta"
                  id="studentName"
                />
              </div>
              <div className="student-info-box">
                <label for="studentClass">Třída:</label>
                <input
                  type="text"
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                  placeholder="Třída"
                  id="studentClass"
                />
              </div>
              <div className="student-info-box">
                <label for="schoolYear">Školní rok:</label>
                <input
                  type="text"
                  value={schoolYear}
                  onChange={(e) => setSchoolYear(e.target.value)}
                  placeholder="Školní rok"
                  id="schoolYear"
                />
              </div>
            </div>
          </div>
          {Object.entries(groupedRecords).map(([type, books]) => (
            <div key={type} style={{ marginBottom: "20px" }}>
              <Text size="lg" weight={700} mt="md" mb="sm">
                {type} (Min: {CATEGORY_REQUIREMENTS[type] || 0})
              </Text>
              <Table highlightOnHover withBorder withColumnBorders>
                <Table.Tbody>
                  {books.map((record) => (
                    <Table.Tr
                      key={record.id}
                      onClick={() => toggleSelection(record.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <Table.Td style={{ width: "10px" }}>
                        <Checkbox
                          checked={selectedBooks.has(record.id)}
                          //onChange={() => toggleSelection(record.id)}
                          color="var(--secondary)"
                        />
                      </Table.Td>
                      <Table.Td style={{ width: "10px" }}>{record.id}</Table.Td>
                      <Table.Td style={{ width: "150px" }}>
                        {record.book_name}
                      </Table.Td>
                      <Table.Td style={{ width: "130px" }}>
                        {record.author_name}
                      </Table.Td>
                      <Table.Td style={{ width: "20px" }}>
                        <Badge
                          variant="light"
                          radius="sm"
                          color={
                            record.form === "próza"
                              ? "green"
                              : record.form === "drama"
                              ? "orange"
                              : record.form === "poezie"
                              ? "purple"
                              : "gray"
                          }
                        >
                          {record.form}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>
          ))}
        </div>

        <div className="maturita-side-panel">
          <div>
            <div className="selected-books">
              <Text mb={10} size="xl">
                Vybrané knihy
              </Text>
              <Text mb={10} size="xs">
                Počet: {totalSelected}
              </Text>
              <div className="validation-messages">
                {validationMessages.map((msg, index) => (
                  <Text
                    key={index}
                    color={msg.startsWith("✅") ? "green" : "red"}
                  >
                    {msg}
                  </Text>
                ))}
                {!isNameValid && (
                  <Text color="red" size="xs" mt={5}>
                    Jméno není správně vyplněno.
                  </Text>
                )}
                {!isSchoolYearValid && (
                  <Text color="red" size="xs" mt={2}>
                    Školní rok musí být čtyřciferné číslo.
                  </Text>
                )}
                {studentClass.trim() === "" && (
                  <Text color="red" size="xs" mt={2}>
                    Třída musí být vyplněna.
                  </Text>
                )}
              </div>
              <Button
                onClick={() => exportToPDF()}
                disabled={!isValidSelection || !isFormFilled}
                color="var(--success)"
              >
                Exportovat vybrané knihy
              </Button>
              <Button onClick={clearSelection} color="var(--danger)" mt="sm">
                Smazat výběr
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Maturita;
