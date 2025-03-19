import { Tabs } from "@mantine/core";

import "./style/Admin.css";
import StatsTab from "./components/tabs/StatsTab";
import ScheduleTab from "./components/tabs/ScheduleTab";
import RequirementsTab from "./components/tabs/RequirementsTab";
import ReservationsTab from "./components/tabs/ReservationsTab";
import ReviewsTab from "./components/tabs/ReviewsTab";
import ReadingTab from "./components/tabs/ReadingTab";
import UsersTab from "./components/tabs/UsersTab";

const Admin = () => {

  return (
    <div className="admin">
      <Tabs defaultValue="stats" color="#de4118">
        <Tabs.List>
          <Tabs.Tab value="schedule">
            Rozvrh
          </Tabs.Tab>
          <Tabs.Tab value="stats">
            Statistiky
          </Tabs.Tab>
          <Tabs.Tab value="requirements" >
            Požadavky
          </Tabs.Tab>
          <Tabs.Tab value="reservations">
            Rezervace
          </Tabs.Tab>
          <Tabs.Tab value="reviews">
            Recenze
          </Tabs.Tab>
          <Tabs.Tab value="reading_list">
            Maturitní četba
          </Tabs.Tab>
          <Tabs.Tab value="users">
            Přehled uživatelů
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="schedule" pt="sm">
          <ScheduleTab />
        </Tabs.Panel>

        <Tabs.Panel value="stats" pt="sm">
          <StatsTab />
        </Tabs.Panel>

        <Tabs.Panel value="requirements" pt="sm">
          <RequirementsTab />
        </Tabs.Panel>

        <Tabs.Panel value="reservations" pt="sm">
          <ReservationsTab />
        </Tabs.Panel>

        <Tabs.Panel value="reviews" pt="sm">
          <ReviewsTab />
        </Tabs.Panel>

        <Tabs.Panel value="reading_list" pt="sm">
          <ReadingTab />
        </Tabs.Panel>

        <Tabs.Panel value="users" pt="sm">
          <UsersTab />
        </Tabs.Panel>
      </Tabs>

    </div>
  );
};

export default Admin;