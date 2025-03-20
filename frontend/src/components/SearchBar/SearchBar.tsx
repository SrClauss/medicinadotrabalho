import { FormControl, InputLabel,InputAdornment, IconButton, TextField, Box } from "@mui/material";
import { Search } from "@mui/icons-material";
import { useState } from "react";
interface SerchBarProps{

    onSearch: (searchTerm: string) => void;
    label : string;
    
}
export default function SearchBar({onSearch, label}: SerchBarProps){

    const[critery, setCritery] = useState<string>('');
    return(
        <Box sx={{marginLeft: {xs:2, md: 4}, marginRight:{xs: 2, md: 4  }   }}>



           
            <TextField
                label={label}
                fullWidth
                id="outlined-adornment-amount"
                value={critery}
                onChange={(e) => setCritery(e.target.value)}
                slotProps={{
                    input: {
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton onClick={() => onSearch(critery)}>
                                    <Search />
                                </IconButton>
                            </InputAdornment>
                        ),
                    },
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        onSearch(critery);
                }}}
            />
        </Box>
    );
}