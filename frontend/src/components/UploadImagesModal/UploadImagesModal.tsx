import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle, // Importe DialogTitle
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
  Divider,
  Paper
} from "@mui/material";
import { Delete, Scanner } from "@mui/icons-material";
import { Box } from "@mui/system";
import { useState, ChangeEvent } from "react";

interface RenamedFile {
  file: File;
  newName: string;
}

interface UploadImagesModalProps {
  open: boolean;
  onClose: () => void;
  examId: string;
  name: string;
}

export default function UploadImagesModal({ open, onClose, examId, name }: UploadImagesModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [renamedFiles, setRenamedFiles] = useState<RenamedFile[]>([]);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isUploaded, setIsUploaded] = useState<boolean>(false);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles((prevSelectedFiles) => [...prevSelectedFiles, ...files]);
    setRenamedFiles((prevRenamedFiles) => {
      const newRenamedFiles = files.map((file) => ({ file, newName: "" }));
      return [...prevRenamedFiles, ...newRenamedFiles];
    });
    setIsReady(false);
    setIsUploaded(false);
  };

  const handleFileDelete = (index: number) => {
    setSelectedFiles((prevSelectedFiles) => {
      const newFiles = [...prevSelectedFiles];
      newFiles.splice(index, 1);
      return newFiles;
    });

    setRenamedFiles((prevRenamedFiles) => {
      const newRenamedFiles = [...prevRenamedFiles];
      newRenamedFiles.splice(index, 1);
      return newRenamedFiles;
    });
    setIsReady(false);
    setIsUploaded(false);
  };

  const handlePrepareImages = () => {
    console.log("Preparando imagens...");
    setRenamedFiles(() => {
      const newRenamedFiles = selectedFiles.map((file, index) => {
        const newName = `${examId}_${String(index).padStart(3, '0')}.${file.name.split('.').pop()}`;
        return { file, newName };
      });
      console.log("Arquivos renomeados:", newRenamedFiles);
      return newRenamedFiles;
    });
    setIsReady(true);
    setIsUploaded(false);
  };

  const handleSendImages = async () => {
    console.log("Enviando imagens para o backend...");

    const formData = new FormData();
    renamedFiles.forEach((renamedFile) => {
      formData.append('imagens', renamedFile.file, renamedFile.newName);
      formData.append('image_names', renamedFile.newName.split('.')[0]);
    });
    formData.append('exam_id', examId);

    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/images/upload_images`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        console.log("Imagens enviadas com sucesso!");
        setIsUploaded(true);
        onClose(); // Fechar o modal após o upload bem-sucedido
      } else {
        console.error(`Erro ao enviar as imagens: ${response.statusText}`);
        setIsUploaded(false);
      }
    } catch (error) {
      console.error("Erro ao enviar as imagens:", error);
      setIsUploaded(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Upload de Imagens - {name}</DialogTitle>
      <Divider sx={{marginX: 2}} />
      <DialogContent sx={{ padding: '24px' }}> {/* Aumenta o preenchimento interno */}
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',        // Espaçamento entre os elementos
        }}>
          <Box sx={{
            display: 'flex',
            justifyContent: "flex-end",
          }}>
            <Button variant="contained" color="primary" component="label">
              <Scanner sx={{ marginRight: '8px' }} /> {/* Reduz o espaço à direita */}
              Adicionar Imagem
              <input type="file" hidden multiple onChange={handleFileSelect} accept="image/*, application/pdf" />
            </Button>
          </Box>

          <List>
            {selectedFiles.map((file, index) => (

              <Paper elevation={1} key={index} sx={{ paddingX: 2, marginBottom: 2 }}>

                <ListItem
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0', // Reduz o preenchimento vertical
                  }}
                >
                  <ListItemText
                    primary={file.name}
                    secondary={
                      <Typography variant="caption" color="textSecondary">
                        Tamanho: {(file.size / 1024).toFixed(2)} KB
                        {renamedFiles[index] && ` - Novo Nome: ${renamedFiles[index].newName}`}
                      </Typography>
                    }
                  />
                  <IconButton edge="end" aria-label="delete" onClick={() => handleFileDelete(index)}>
                    <Delete color="error"/>
                  </IconButton>
                </ListItem>
              </Paper>
            ))}
          </List>

          {selectedFiles.length > 0 && (
            <Button
              variant="contained"
              color={isReady ? (isUploaded ? "success" : "primary") : "primary"}
              onClick={isReady ? handleSendImages : handlePrepareImages}
              disabled={isUploaded}
              sx={{ marginTop: '16px' }} // Adiciona um pouco de espaço acima do botão
            >
              {isReady ? (isUploaded ? "Imagens Enviadas" : "Enviar Imagens") : "Preparar Imagens"}
            </Button>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}