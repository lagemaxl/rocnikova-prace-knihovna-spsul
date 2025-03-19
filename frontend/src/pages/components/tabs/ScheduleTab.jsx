import React from "react";
import { useEffect, useState } from "react";
import pb from "../../../lib/pocketbase";
import { Skeleton, Switch, Table, TextInput, Button } from "@mantine/core";

function ScheduleTab() {
  const [isOpen, setIsOpen] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [librarySchedule, setLibrarySchedule] = useState(null);
  const [loadingSchedule, setLoadingSchedule] = useState(true);

  useEffect(() => {
    const fetchIsOpen = async () => {
      try {
        const record = await pb.collection("admin").getOne("95k5p6sc3wqdeyq");
        setIsOpen(record.bool);
      } catch (err) {
        console.error("Error fetching schedule:", err);
      }
    };

    fetchIsOpen();
  }, []);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const record = await pb.collection("admin").getOne("wjonohaqmzn4uuk");
        setLibrarySchedule(record.data.library_schedule);
        setIsActive(record.bool);
        setLoadingSchedule(false);
      } catch (error) {
        console.error("Failed to fetch library schedule", error);
        setNotification({
          message: "Nepodařilo se načíst rozvrh knihovny",
          color: "red",
        });
        setLoadingSchedule(false);
      }
    };

    fetchSchedule();
  }, []);

  const saveEdit = async () => {
    try {
      const data = {
        text: "Updated timetable",
        bool: isActive,
        data: { library_schedule: librarySchedule },
      };

      await pb.collection("admin").update("wjonohaqmzn4uuk", data);
      setNotification({
        message: "Úpravy byly úspěšně uloženy",
        color: "green",
      });
    } catch (error) {
      console.error("Failed to save schedule updates", error);
      setNotification({
        message: "Nepodařilo se uložit úpravy",
        color: "red",
      });
    }
  };

  const handleActiveChange = async (checked) => {
    setIsActive(checked);
  };

  const renderScheduleTable = () => {
    if (loadingSchedule) return <Skeleton height={300} />;

    const dayOrder = [
      "pondělí",
      "úterý",
      "středa",
      "čtvrtek",
      "pátek",
      "sobota",
      "neděle",
    ];

    const tableRows = Object.entries(librarySchedule).flatMap(
      ([weekType, weekData]) => {
        const sortedDays = Object.keys(weekData.opening_hours).sort(
          (a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b)
        );

        return sortedDays.map((day) => {
          const details = weekData.opening_hours[day];
          return (
            <Table.Tr key={`${weekType}-${day}`}>
              <Table.Td>{weekType === "even_week" ? "Sudý" : "Lichý"}</Table.Td>
              <Table.Td>{day}</Table.Td>
              <Table.Td>
                <TextInput
                  value={details.open}
                  onChange={(e) =>
                    handleEditChange(weekType, day, "open", e.target.value)
                  }
                />
              </Table.Td>
              <Table.Td>
                <TextInput
                  value={details.close}
                  onChange={(e) =>
                    handleEditChange(weekType, day, "close", e.target.value)
                  }
                />
              </Table.Td>
              <Table.Td>
                <TextInput
                  value={details.supervision}
                  onChange={(e) =>
                    handleEditChange(
                      weekType,
                      day,
                      "supervision",
                      e.target.value
                    )
                  }
                />
              </Table.Td>
            </Table.Tr>
          );
        });
      }
    );
    return (
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Týden</Table.Th>
            <Table.Th>Den</Table.Th>
            <Table.Th>Otevřeno</Table.Th>
            <Table.Th>Zavřeno</Table.Th>
            <Table.Th>Dohled</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{tableRows}</Table.Tbody>
      </Table>
    );
  };

  const handleSwitchChange = async (event) => {
    const newValue = event.currentTarget.checked;
    setIsOpen(newValue);

    const data = { bool: newValue };

    try {
      await pb.collection("admin").update("95k5p6sc3wqdeyq", data);
    } catch (error) {
      console.error("Failed to update data", error);
    }
  };

  const handleEditChange = (weekType, day, field, value) => {
    const updatedSchedule = { ...librarySchedule };
    updatedSchedule[weekType].opening_hours[day][field] = value;
    setLibrarySchedule(updatedSchedule);
  };

  return (
    <div>
      <h2>Rozvrh knihovny</h2>
      <div>
        <p>Manuální ovládání</p>
        <Switch
          checked={isOpen}
          color="var(--secondary)"
          onChange={handleSwitchChange}
          label={isOpen ? "Otevřeno" : "Zavřeno"}
        />
        <p>Rozvrh knihovny</p>
        <div style={{ margin: "1rem 0" }}>
          <Switch
            checked={isActive}
          color="var(--secondary)"
            onChange={(event) =>
              handleActiveChange(event.currentTarget.checked)
            }
            label={
              isActive
                ? "Používá se rozvrh"
                : "Používá se manuální ovládání otevírací doby"
            }
          />
        </div>
        {renderScheduleTable()}
        <Button
          onClick={saveEdit}
          style={{ marginTop: "1rem" }}
          color="var(--success)"
        >
          Uložit změny
        </Button>
      </div>
    </div>
  );
}

export default ScheduleTab;
