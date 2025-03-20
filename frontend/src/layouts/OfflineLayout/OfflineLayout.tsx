import { Box } from "@mui/material";
import Footer from "../MainLayout/Footer";
import Header from "./Header";
import { ReactNode } from "react";

export default function OfflineLayout({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />

      <Box 
        component="main"
        sx={{ 
          maxHeight: 'calc(100vh - 128px)',
          overflowY: 'auto',
          marginBottom: '64px',
          flex: 1,

        }}
      >
        {children}
      </Box>

      <Footer />
    </Box>
  );
}