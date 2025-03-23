import React, { useState } from 'react';
import UsuarioView from '../UsuarioView/UsuarioView';
import { Container, Paper, Box, Typography, TextField, IconButton, Switch } from '@mui/material';
import CPFSearchView from '../../components/CPFSearchView/CPFSearchView';
import SearchBar from '../../components/SearchBar/SearchBar';
import TitleForm from '../../components/TitleForm/TitleForm';
import { Search, PersonSearch } from '@mui/icons-material';

 const UsuarioContainer: React.FC = () => {
    const [pesquisaPorCPF, setPesquisaPorCPF] = useState(false);
    return(
        <Box >
            <Box sx={{position: 'relative', display: 'flex', justifyContent: "end", paddingTop: 6}}>
                <Box sx={{position: 'absolute', top: {md: 2, xs: 0}, right: 10, display: 'flex', justifyContent: 'space-between', backgroundColor: 'transparent', padding: 1, borderRadius: 2}}>
                    <Typography sx={{marginTop: 1}}>
                        Pesquisar por:{pesquisaPorCPF? 'CPF': 'Nome'}
                    </Typography>
                    <Switch value={pesquisaPorCPF} onChange={()=>setPesquisaPorCPF(!pesquisaPorCPF)}/>
                </Box>
            </Box>
            <Box >
                {pesquisaPorCPF? <CPFSearchView/>: <UsuarioView/>}
            </Box>
        </Box>

    )
}

export default UsuarioContainer;