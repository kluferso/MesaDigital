import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  IconButton,
  CircularProgress,
  Paper,
  Tooltip
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
  PictureAsPdf as PdfIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../../contexts/SocketContext';
import { useWebRTC } from '../../contexts/webrtc/WebRTCContext';
import { useParams } from 'react-router-dom';

const SheetMusicPanel = ({ onClose }) => {
  const { t } = useTranslation();
  const { socket } = useSocket();
  const { shareFile } = useWebRTC();
  const { roomId } = useParams();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [currentFilename, setCurrentFilename] = useState('');

  useEffect(() => {
    if (!socket) return;

    socket.on('file_shared', (data) => {
      if (data.type === 'pdf') {
        setPdfUrl(data.url);
        setCurrentFilename(data.filename);
      }
    });

    return () => {
      socket.off('file_shared');
    };
  }, [socket]);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    } else {
      alert(t('sheetMusic.invalidType', 'Por favor, selecione um arquivo PDF.'));
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    
    try {
      // Use centralized shareFile method
      await shareFile(file);
      setFile(null);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(t('sheetMusic.uploadError', 'Erro ao enviar arquivo.'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden',
        bgcolor: 'background.paper',
        borderRadius: 2
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PdfIcon color="primary" />
          {t('sheetMusic.title', 'Partituras')}
        </Typography>
        <Box>
           <input
            accept="application/pdf"
            style={{ display: 'none' }}
            id="raised-button-file"
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="raised-button-file">
            <Button variant="outlined" component="span" size="small" startIcon={<CloudUploadIcon />}>
              {t('sheetMusic.upload', 'Upload PDF')}
            </Button>
          </label>
          {onClose && (
            <IconButton onClick={onClose} size="small" sx={{ ml: 1 }}>
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1, position: 'relative', bgcolor: '#f5f5f5', display: 'flex', flexDirection: 'column' }}>
        {file && !uploading && (
          <Box sx={{ p: 2, bgcolor: 'warning.light', color: 'warning.contrastText', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <Typography variant="body2">
               {t('sheetMusic.selected', 'Selecionado')}: {file.name}
             </Typography>
             <Box>
               <Button size="small" onClick={() => setFile(null)} sx={{ mr: 1, color: 'inherit' }}>{t('common.cancel', 'Cancelar')}</Button>
               <Button size="small" variant="contained" onClick={handleUpload} disabled={uploading} color="primary">
                 {t('common.confirm', 'Confirmar')}
               </Button>
             </Box>
          </Box>
        )}

        {uploading && (
          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(255,255,255,0.7)', zIndex: 10 }}>
            <CircularProgress />
          </Box>
        )}

        {pdfUrl ? (
          <Box sx={{ flexGrow: 1, width: '100%', height: '100%' }}>
            <iframe 
              src={pdfUrl} 
              width="100%" 
              height="100%" 
              style={{ border: 'none' }} 
              title="Sheet Music"
            />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary', flexDirection: 'column' }}>
            <PdfIcon sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
            <Typography>{t('sheetMusic.noFile', 'Nenhuma partitura compartilhada')}</Typography>
          </Box>
        )}
      </Box>
      
      {currentFilename && (
        <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
          <Typography variant="caption" color="text.secondary">
            {t('sheetMusic.current', 'Visualizando')}: {currentFilename}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default SheetMusicPanel;
