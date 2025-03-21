import { Box, Typography, Divider } from "@mui/material";
interface TitleFormProps {
    title: string;
    id: string;
    }
export default function TitleForm({ title, id }: TitleFormProps) {
    return (
        <Box id={`head-box-${id}`} sx={{ textAlign: "center", padding: 2 }}>
        <Typography variant="h6">{title}</Typography>
        <Divider sx={{ marginTop: 1, marginBottom: 2 }} />
      </Box>
    )
}