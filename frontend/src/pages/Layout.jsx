import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Button,
  Text,
  Modal,
  TextInput,
  PasswordInput,
  Stack,
  Notification,
  Badge,
  Alert,
  Burger,
  Menu,
  Divider,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { useEffect } from "react";
import pb from "../lib/pocketbase";
import "./style/Layout.css";
import {
  IconInfoCircle,
  IconLogout,
  IconHome,
  IconBook,
  IconUser,
} from "@tabler/icons-react";

const Layout = () => {
  const [opened, { open, close }] = useDisclosure(false);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notification, setNotification] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [menuOpened, { toggle: toggleMenu, close: closeMenu }] =
    useDisclosure(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path) => location.pathname === path;

  const [
    forgotPasswordOpened,
    { open: openForgotPassword, close: closeForgotPassword },
  ] = useDisclosure(false);
  const [emailForgotPassword, setEmailForgotPassword] = useState("");

  const showNotification = (message, color) => {
    setNotification({ message, color });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  useEffect(() => {
    fetchOpenStatus();
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1000);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleForm = () => {
    setIsRegister((prev) => !prev);
    resetForm();
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
  };

  const handleRegister = async (event) => {
    event.preventDefault();
  
    const allowedDomains = ["@spsul.cz", "@zak.spsul.cz"];
    const isEmailAllowed = allowedDomains.some((domain) =>
      email.endsWith(domain)
    );
  
    if (!isEmailAllowed) {
      showNotification("Registrace povolena pouze pro školní e-maily (@spsul.cz nebo @zak.spsul.cz)", "red");
      return;
    }
  
    const randomPassword = Math.random().toString(36).slice(-8);
    const username = email.split("@")[0];
    const data = {
      username: username,
      email: email,
      emailVisibility: true,
      password: randomPassword,
      passwordConfirm: randomPassword,
    };
  
    try {
      const record = await pb.collection("users").create(data);
      await pb.collection("users").requestPasswordReset(email);
      showNotification("Registrace byla úspěšná! Zkontroluj si mail", "green");
      close();
      resetForm();
    } catch (error) {
      showNotification("Registrace selhala. Zkuste to znovu.", "red");
    }
  };
  

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      const authData = await pb
        .collection("users")
        .authWithPassword(email, password);
      showNotification("Přihlášení bylo úspěšné!", "green");
      close();
      resetForm();
    } catch (error) {
      showNotification("Přihlášení selhalo. Zkuste to znovu.", "red");
    }
  };

  const fetchManualOpenStatus = async () => {
    try {
      const record = await pb.collection("admin").getOne("95k5p6sc3wqdeyq");
      setIsOpen(record.bool);
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  };

  const fetchOpenStatus = async () => {
    try {
      const record = await pb.collection("admin").getOne("wjonohaqmzn4uuk");

      if (record.bool) {
        const data = record.data;
        const now = new Date();
        const dayOfWeek = now.toLocaleDateString("cs-CZ", { weekday: "long" });
        const time = now.toTimeString().split(" ")[0];

        const isEvenWeek = Math.floor(now.getDate() / 7) % 2 === 0;
        const weekType = !isEvenWeek ? "even_week" : "odd_week";

        const todaySchedule =
          data.library_schedule[weekType]?.opening_hours[dayOfWeek];

        if (todaySchedule) {
          const { open, close } = todaySchedule;
          if (time >= open && time <= close) {
            setIsOpen(true);
          } else {
            setIsOpen(false);
          }
        } else {
          //console.warn(`Žádné údaje pro ${dayOfWeek}`);
          setIsOpen(false);
        }
      } else {
        fetchManualOpenStatus();
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  };

  const icon = <IconInfoCircle />;

  const isRegisterDisabled = false;

  return (
    <>
      <Modal
        opened={opened}
        onClose={() => {
          close();
          resetForm();
        }}
        title={isRegister ? "Registrace" : "Přihlášení"}
        fullScreen={isMobile}
      >
        <form onSubmit={isRegister ? handleRegister : handleLogin}>
          <Stack>
            <TextInput
              label="Email"
              placeholder="Vložte váš email"
              required
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
            />
            {!isRegister && (
              <PasswordInput
                label="Heslo"
                placeholder="Vložte heslo"
                required
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
              />
            )}
            {isRegisterDisabled && (
              <>
                <Alert
                  variant="light"
                  color="red"
                  title="REGISTRACE JE AKTUÁLNĚ NEDOSTUPNÁ"
                  icon={icon}
                ></Alert>
              </>
            )}
            <Button
              type="submit"
              color="var(--secondary)"
              disabled={isRegisterDisabled}
            >
              {" "}
              {/*  */}
              {isRegister ? "Registrovat se" : "Přihlásit se"}
            </Button>

            <Text
              size="sm"
              onClick={toggleForm}
              style={{
                cursor: "pointer",
                textAlign: "center",
                marginTop: "10px",
              }}
            >
              {isRegister
                ? "Už máte účet? Přihlaste se"
                : "Ještě nemáte účet? Registrujte se"}
            </Text>
            <Text
              size="sm"
              onClick={() => {
                close();
                openForgotPassword();
              }}
              style={{
                cursor: "pointer",
                textAlign: "center",
                marginTop: "10px",
              }}
            >
              Zapomněli jste heslo?
            </Text>
          </Stack>
        </form>
      </Modal>
      <Modal
        opened={forgotPasswordOpened}
        onClose={() => {
          closeForgotPassword();
          setEmailForgotPassword("");
        }}
        title="Obnova hesla"
        fullScreen={isMobile}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await pb
                .collection("users")
                .requestPasswordReset(emailForgotPassword);
              showNotification("Email s instrukcemi byl odeslán!", "green");
              closeForgotPassword();
              setEmailForgotPassword("");
            } catch (error) {
              showNotification("Něco se pokazilo. Zkuste to znovu.", "red");
            }
          }}
        >
          <Stack>
            <TextInput
              label="Email"
              placeholder="Zadejte svůj e-mail"
              required
              value={emailForgotPassword}
              onChange={(e) => setEmailForgotPassword(e.currentTarget.value)}
            />
            <Button type="submit" color="var(--secondary)">
              Odeslat instrukce k obnovení hesla
            </Button>
          </Stack>
        </form>
      </Modal>
      <nav>
        <div>
          <img src="/knihovna_logo.webp" alt="Knihovna logo" />
          <div className="logo-text-cointainer">
            <Badge color="green" variant="transparent" size="sm"></Badge>
            <Text fw={700} size="lg" color="black">
              Knihovna
            </Text>
            {isOpen ? (
              <Badge color="green" variant="dot" size="sm">
                OTEVŘENO
              </Badge>
            ) : (
              <Badge color="red" variant="dot" size="sm">
                ZAVŘENO
              </Badge>
            )}
          </div>
          {!isMobile && (
            <>
              <Link to="/" className={isActive("/") ? "active-link" : ""}>
                Domů
              </Link>
              <Link
                to="/about"
                className={isActive("/about") ? "active-link" : ""}
              >
                Informace
              </Link>
              <Link
                to="/maturita"
                className={isActive("/maturita") ? "active-link" : ""}
              >
                Maturitní četba
              </Link>
              {pb.authStore.isValid && (
                <>
                  <Link
                    to="/my-account"
                    className={isActive("/my-account") ? "active-link" : ""}
                  >
                    Moje výpujčky
                  </Link>
                </>
              )}
              {pb.authStore.isValid && pb.authStore.model.role === "teacher" && (
                <Link
                  to="/admin-borrows"
                  className={isActive("/admin-borrows") ? "active-link" : ""}
                >
                  Výpůjčky
                </Link>
              )}
              {pb.authStore.isValid && pb.authStore.model.role === "admin" && (
                <>
                  <Link
                    to="/admin-books"
                    className={isActive("/admin-books") ? "active-link" : ""}
                  >
                    Správa knih
                  </Link>
                  <Link
                    to="/admin-borrows"
                    className={isActive("/admin-borrows") ? "active-link" : ""}
                  >
                    Výpůjčky
                  </Link>
                  <Link
                    to="/admin"
                    className={isActive("/admin") ? "active-link" : ""}
                  >
                    Admin
                  </Link>
                </>
              )}
            </>
          )}
        </div>

        {!isMobile ? (
          pb.authStore.isValid ? (
            <Button
              color="var(--secondary)"
              onClick={() => {
                pb.authStore.clear();
                navigate("/");
                showNotification("Odhlášení bylo úspěšné!", "green");
              }}
            >
              Odhlásit se
            </Button>
          ) : (
            <Button color="var(--secondary)" onClick={open}>
              Přihlásit se
            </Button>
          )
        ) : (
          <Burger opened={menuOpened} onClick={toggleMenu}></Burger>
        )}
      </nav>

      {menuOpened && isMobile && (
        <div className="fullscreen-menu">
          <div className="menu-content">
            <ul>
              <li>
                <Link to="/" onClick={toggleMenu}>
                  Domů
                </Link>
              </li>
              <li>
                <Link to="/about" onClick={toggleMenu}>
                  Informace
                </Link>
              </li>
              {pb.authStore.isValid && (
                <>
                  <li>
                    <Link to="/my-account" onClick={toggleMenu}>
                      Moje výpujčky
                    </Link>
                  </li>
                  {/**
                  <li>
                    <Link to="/maturita" onClick={toggleMenu}>
                      Maturitní četba
                    </Link>
                  </li>
                    */}
                </>
              )}
              {pb.authStore.isValid && pb.authStore.model.role === "admin" && (
                <>
                  <li>
                    <Link to="/admin-books" onClick={toggleMenu}>
                      Správa knih
                    </Link>
                  </li>
                  <li>
                    <Link to="/admin-borrows" onClick={toggleMenu}>
                      Půjčky
                    </Link>
                  </li>
                  <li>
                    <Link to="/admin" onClick={toggleMenu}>
                      Admin
                    </Link>
                  </li>
                </>
              )}
              {pb.authStore.isValid ? (
                <li>
                  <Button
                    color="var(--secondary)"
                    onClick={() => {
                      pb.authStore.clear();
                      showNotification("Odhlášení bylo úspěšné!", "green");
                      toggleMenu();
                    }}
                  >
                    Odhlásit se
                  </Button>
                </li>
              ) : (
                <li>
                  <Button
                    color="var(--secondary)"
                    onClick={() => {
                      open();
                      toggleMenu();
                    }}
                  >
                    Přihlásit se
                  </Button>
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      {notification && (
        <Notification
          color={notification.color}
          onClose={() => setNotification(null)}
          className="notification"
        >
          {notification.message}
        </Notification>
      )}

      <div className="outlet">
        <Outlet />
      </div>
    </>
  );
};

export default Layout;
