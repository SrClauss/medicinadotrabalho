import { Box } from "@mui/material";

interface TwoColumnsFormProps {
    children: React.ReactNode;
    id: string;
}

export default function TwoColumnsForm({ children, id }: TwoColumnsFormProps) {
    return (
        <Box 
            id={id} 
            sx={{ 
                display: "flex",
                flexDirection: { xs: "column", md: "row" }, 
                gap: 2,
                padding: { xs: 1, md: 2 }
            }}
        >
            {children}
        </Box>
    );
}
