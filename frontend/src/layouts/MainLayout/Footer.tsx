import {AppBar, Paper, Typography, Switch } from '@mui/material';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';



export default function Footer() {
  const { isDarkMode, toggleTheme } = useAppTheme();


  return (
        <AppBar component={"footer"} position="fixed" sx={{ top: 'auto', bottom: 0 }}>
          <Paper elevation={10} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 2 , backgroundColor: 'inherit'}}>
            <Typography variant="caption" sx={{ color: 'white' }}>Todos Direitos Reservados © 2025</Typography>
            <Switch checked={isDarkMode} onChange={toggleTheme} />
          </Paper>
        </AppBar>
   

  );
}