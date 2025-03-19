import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "@mantine/core/styles.css";
import "./pages/style/Theme.css";
import { MantineProvider } from "@mantine/core";
import { Notifications } from '@mantine/notifications';
import { DatesProvider } from "@mantine/dates";
import { PrimeReactProvider, PrimeReactContext } from "primereact/api";
import "primereact/resources/themes/saga-orange/theme.css";
import "dayjs/locale/cs";

import Layout from "./pages/Layout";
import Home from "./pages/Home";
import AdminBooks from "./pages/Admin-Books";
import ChangePassword from "./pages/ChangePassword";
import AdminBorrows from "./pages/Admin-Borrows";
import Admin from "./pages/Admin";
import NoPage from "./pages/NoPage";
import About from "./pages/About";
import Maturita from "./pages/Maturita";
import MyAcc from "./pages/MyAcc";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <MantineProvider>
      <Notifications />
      <PrimeReactProvider>
        <DatesProvider settings={{ locale: "cs" }}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="admin-books" element={<AdminBooks />} />
                <Route path="admin-borrows" element={<AdminBorrows />} />
                <Route path="about" element={<About />} />
                <Route path="maturita" element={<Maturita />} />
                <Route path="my-account" element={<MyAcc />} />
                <Route
                  path="change-password/:TOKEN"
                  element={<ChangePassword />}
                />
                <Route path="admin" element={<Admin />} />
                <Route path="*" element={<NoPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </DatesProvider>
      </PrimeReactProvider>
    </MantineProvider>
  </React.StrictMode>
);
