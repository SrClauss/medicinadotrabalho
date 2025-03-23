import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  Divider,
} from "@mui/material";
import { Link } from "react-router-dom";
import MenuButton from "../../components/MenuButton/MenuButton";
import logo from "../../assets/logo.png";
import { useUser } from "../../contexts/UserContext/UserContext";
import {
  Person,
  Business,
  Send,
  Contacts,
  Logout,
  Apartment,
} from "@mui/icons-material";

export default function ButtonAppBar() {
  const {logout} = useUser();

  return (
    <AppBar position="static">
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexGrow: 1,
          }}
        >
          <Box
            sx={{ display: { xs: "flex", md: "none" }, alignItems: "center" }}
          >
            <MenuButton />
          </Box>

          <Box
            sx={{ display: { xs: "none", md: "flex" }, alignItems: "center" }}
          >
            <a
              href="https://www.clinicaaudionorte.com.br/home/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={logo} alt="logo" style={{ width: 100 }} />
            </a>
          </Box>
        </Box>
        <Box>
          <Button color="inherit" onClick={logout}>
            <Logout />
            <Typography variant="caption" sx={{ ml: 1 }}>
              Sair
            </Typography>
          </Button>
        </Box>
      </Toolbar>
      <Divider />
      <Toolbar
        sx={{
          justifyContent: "space-between",
          display: { xs: "none", md: "flex" },
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexGrow: 1,
            justifyContent: "space-around",
          }}
        >
          <Link
            to="/cadastro-usuario"
            style={{
              textDecoration: "none",
              color: "inherit",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.1)" },
                padding: 1,
                borderRadius: 1,
              }}
            >
              <Person />
              <Typography variant="caption" sx={{ ml: 1 }}>
                Cadastrar Usuarios
              </Typography>
            </Box>
          </Link>
          <Divider orientation="vertical" flexItem />
          <Link
            to="/cadastro-empresa"
            style={{
              textDecoration: "none",
              color: "inherit",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.1)" },
                padding: 1,
                borderRadius: 1,
              }}
            >
              <Business />
              <Typography variant="caption" sx={{ ml: 1 }}>
                Cadastrar Empresas
              </Typography>
            </Box>
          </Link>
          <Divider orientation="vertical" flexItem />
          <Link
            to="/empresas-container"
            style={{
              textDecoration: "none",
              color: "inherit",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.1)" },
                padding: 1,
                borderRadius: 1,
              }}
            >
              <Apartment />
              <Typography variant="caption" sx={{ ml: 1 }}>
                Gereciar Empresas
              </Typography>
            </Box>
          </Link>
          <Divider orientation="vertical" flexItem />
          <Link
            to="/usuarios-container/"
            style={{
              textDecoration: "none",
              color: "inherit",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.1)" },
                padding: 1,
                borderRadius: 1,
              }}
            >
              <Contacts />
              <Typography variant="caption" sx={{ ml: 1 }}>
                Gerenciar Usuarios
              </Typography>
            </Box>
          </Link>
         
        </Box>
      </Toolbar>
    </AppBar>
  );
}
