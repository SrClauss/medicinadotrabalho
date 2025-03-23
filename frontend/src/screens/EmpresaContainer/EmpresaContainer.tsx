import React, { useState } from 'react';
import EmpresaView from '../EmpresaView/EmpresaView';
import { Box, Typography, Switch } from '@mui/material';
import CNPJSearchView from '../../components/CNPJSearchView/CNPJSearchView';

const EmpresaContainer: React.FC = () => {
    const [pesquisaPorCNPJ, setPesquisaPorCNPJ] = useState(false);

    return (
        <Box>
            <Box sx={{ position: 'relative', display: 'flex', justifyContent: "end", paddingTop: 6 }}>
                <Box sx={{ position: 'absolute', top: { md: 2, xs: 0 }, right: 10, display: 'flex', justifyContent: 'space-between', backgroundColor: 'transparent', padding: 1, borderRadius: 2 }}>
                    <Typography sx={{ marginTop: 1 }}>
                        Pesquisar por: {pesquisaPorCNPJ ? 'CNPJ' : 'Nome'}
                    </Typography>
                    <Switch value={pesquisaPorCNPJ} onChange={() => setPesquisaPorCNPJ(!pesquisaPorCNPJ)} />
                </Box>
            </Box>
            <Box>
                {pesquisaPorCNPJ ? <CNPJSearchView /> : <EmpresaView />}
            </Box>
        </Box>
    );
};

export default EmpresaContainer;