import { Drawer, IconButton } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import MenuList from "../MenuList/MenuList";
import { useState } from "react";
export default function MenuButton(){
    const [open, setOpen] = useState(false);

    return (
        <>
        <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={() => {setOpen(true)}}
        >
            <MenuIcon />

        </IconButton>
        <Drawer open={open} onClose={() => setOpen(false)}>
            <MenuList toggleDrawer={() => setOpen(false)} />
        </Drawer>

        
        </>

    )



}