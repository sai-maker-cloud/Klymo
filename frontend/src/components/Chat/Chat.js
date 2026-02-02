import { useEffect, useState, useRef, useCallback } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { io } from 'socket.io-client';
import Matching from '../Matching/Matching';
import { 
  Box, Typography, TextField, IconButton, Avatar, Divider, 
  Paper, Chip, Button, Stack, useMediaQuery, useTheme, Drawer 
} from '@mui/material';
import { 
  Send, FiberManualRecord, Shield, ExitToApp, NavigateNext, 
  Flag, Terminal, Security, Menu as MenuIcon 
} from '@mui/icons-material';
import { useNavigate } from 'react-router';
import { config } from "../../index";

const Chat = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const socketRef = useRef(null);
  const scrollRef = useRef(null);

  const [deviceId, setDeviceId] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [isMatchmaking, setIsMatchmaking] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [partner, setPartner] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const rawData = localStorage.getItem('aegis_user');
  const user = rawData ? JSON.parse(rawData) : null;
  const userId = user?._id || user?.data?._id;
  const userInterests = JSON.stringify(user?.interests || []);

  const handleNext = useCallback(() => {
    if (socketRef.current) {
      localStorage.removeItem('aegis_current_chat');
      setIsMatchmaking(true);
      setMessages([]);
      setPartner(null);
      setRoomId(null);
      setDrawerOpen(false);
      socketRef.current.emit('requeue');
    }
  }, []);

  const handleTerminate = useCallback(() => {
    localStorage.removeItem('aegis_current_chat');
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    navigate('/');
  }, [navigate]);

  useEffect(() => {
    const savedChat = localStorage.getItem('aegis_current_chat');
    if (savedChat) {
      const parsed = JSON.parse(savedChat);
      setMessages(parsed.messages || []);
      setPartner(parsed.partner || null);
      setRoomId(parsed.roomId || null);
      setIsMatchmaking(false);
    }
  }, []);

  useEffect(() => {
    if (roomId && !isMatchmaking) {
      const chatData = { roomId, partner, messages };
      localStorage.setItem('aegis_current_chat', JSON.stringify(chatData));
    }
  }, [messages, roomId, partner, isMatchmaking]);

  useEffect(() => {
    const initSession = async () => {
      if (!socketRef.current) {
        socketRef.current = io(config.backendPoint);
      }

      const fp = await FingerprintJS.load();
      const result = await fp.get();
      setDeviceId(result.visitorId);

      socketRef.current.off('match_found');
      socketRef.current.off('receive_message');
      socketRef.current.off('partner_disconnected');

      const savedChat = localStorage.getItem('aegis_current_chat');
      if (!savedChat) {
        socketRef.current.emit('join_queue', {
          userId: userId,
          deviceId: result.visitorId,
          username: user?.username || "Guest",
          bio: user?.bio || "",
          interests: JSON.parse(userInterests)
        });
      }

      socketRef.current.on('match_found', (data) => {
        setRoomId(data.roomId);
        setPartner(data.partner);
        setIsMatchmaking(false);
        setMessages([{ 
          text: data.notice, 
          sender: 'system', 
          time: new Date().toLocaleTimeString() 
        }]);
      });

      socketRef.current.on('receive_message', (msg) => {
        setMessages((prev) => [...prev, { ...msg, sender: 'them' }]);
      });

      socketRef.current.on('partner_disconnected', () => {
        localStorage.removeItem('aegis_current_chat');
        setMessages((prev) => [...prev, { text: "SIGNAL_LOST_TERMINATING", sender: 'system' }]);
        setTimeout(() => {
           setIsMatchmaking(true);
           setPartner(null);
           setRoomId(null);
           setMessages([]);
           socketRef.current.emit('requeue');
        }, 2000);
      });
    };

    initSession();

    return () => {
      if (socketRef.current) {
        socketRef.current.off('match_found');
        socketRef.current.off('receive_message');
        socketRef.current.off('partner_disconnected');
      }
    };
  }, [userId, userInterests, user?.username, user?.bio]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isMatchmaking]);

  const handleSendMessage = () => {
    if (!input.trim() || !socketRef.current || !roomId) return;
    const msgData = { roomId, text: input, sender: 'me', time: new Date().toLocaleTimeString() };
    socketRef.current.emit('send_message', msgData);
    setMessages((prev) => [...prev, msgData]);
    setInput("");
  };

  const SidebarContent = (
    <Box sx={{ width: isMobile ? 280 : 300, bgcolor: '#111', height: '100%', display: 'flex', flexDirection: 'column', p: 3, color: '#fff' }}>
      <Typography variant="h6" fontWeight="900" sx={{ mb: 4, letterSpacing: '-1px', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Terminal sx={{ color: '#00ff88' }} />
        AEGIS<span style={{ background: 'linear-gradient(45deg, #007bff, #00ff88)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>.CHAT</span>
      </Typography>

      <Typography variant="caption" sx={{ color: '#555', fontWeight: 'bold', mb: 1.5, display: 'block' }}>USER_NODE</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Avatar sx={{ bgcolor: '#222', border: '1px solid #333', width: 32, height: 32, mr: 1.5 }}>
          {user?.username?.charAt(0).toUpperCase()}
        </Avatar>
        <Box>
          <Typography variant="body2" fontWeight="600">{user?.username || 'Guest'}</Typography>
          <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', fontSize: '0.65rem' }}>
            <FiberManualRecord sx={{ fontSize: 6, mr: 0.5 }} /> ONLINE
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ bgcolor: '#222', mb: 3 }} />

      <Typography variant="caption" sx={{ color: '#555', fontWeight: 'bold', mb: 1.5, display: 'block' }}>REMOTE_PEER</Typography>
      <Box sx={{ p: 2, bgcolor: '#161616', border: '1px solid #222', borderRadius: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Avatar sx={{ width: 32, height: 32, mr: 1.5, bgcolor: '#333', fontSize: '0.8rem' }}>
             {partner?.username ? partner.username.charAt(0).toUpperCase() : '?'}
          </Avatar>
          <Typography variant="body2" fontWeight="bold">{partner?.username || 'Anonymous'}</Typography>
        </Box>
        <Typography variant="caption" sx={{ color: '#888', display: 'block' }}>{partner?.bio || 'Establishing link...'}</Typography>
      </Box>

      <Stack spacing={1.5}>
        <Button variant="contained" fullWidth startIcon={<NavigateNext />} onClick={handleNext} sx={{ background: 'linear-gradient(45deg, #007bff, #00ff88)', color: '#000', fontWeight: 'bold', textTransform: 'none' }}>
          New Session
        </Button>
        <Button variant="outlined" fullWidth startIcon={<ExitToApp />} onClick={handleTerminate} sx={{ borderColor: '#333', color: '#888', textTransform: 'none' }}>
          Terminate
        </Button>
        <Button size="small" startIcon={<Flag />} sx={{ color: '#444', textTransform: 'none', justifyContent: 'flex-start', mt: 1 }}>
          Report User
        </Button>
      </Stack>

      <Box sx={{ mt: 'auto', p: 1.5, bgcolor: '#000', borderRadius: 1.5, border: '1px solid #222' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Security sx={{ fontSize: 14, color: '#00ff88' }} />
          <Typography variant="caption" sx={{ color: '#00ff88', fontWeight: 'bold', fontSize: '0.6rem' }}>
            NODE: {deviceId?.substring(0, 12).toUpperCase()}
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  if (isMatchmaking) return <Matching />;

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw', bgcolor: '#0a0a0a', color: '#fff', overflow: 'hidden' }}>
      
      {!isMobile && SidebarContent}

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} sx={{ '& .MuiDrawer-paper': { bgcolor: 'transparent' } }}>
        {SidebarContent}
      </Drawer>

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
        <Box sx={{ p: 2, bgcolor: '#111', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isMobile && (
                <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: '#fff', mr: 1, p: 0 }}>
                  <MenuIcon />
                </IconButton>
              )}
              <Shield sx={{ color: '#00ff88', fontSize: 18 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                {isMobile ? 'Tunnel_v1' : 'Session_Tunnel_v1'}
              </Typography>
           </Box>
           <Chip label="E2EE" size="small" sx={{ color: '#00ff88', borderColor: '#00ff88', fontSize: '0.6rem' }} variant="outlined" />
        </Box>

        <Box ref={scrollRef} sx={{ flexGrow: 1, overflowY: 'auto', p: isMobile ? 2 : 3, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flexGrow: 1 }} />
          {messages.map((msg, i) => (
            <Box key={i} sx={{ alignSelf: msg.sender === 'me' ? 'flex-end' : (msg.sender === 'system' ? 'center' : 'flex-start'), mb: 2, maxWidth: isMobile ? '85%' : '70%' }}>
              <Paper elevation={0} sx={{ 
                p: '10px 16px', 
                bgcolor: msg.sender === 'me' ? '#007bff' : (msg.sender === 'system' ? 'transparent' : '#161616'), 
                color: msg.sender === 'system' ? '#00ff88' : '#fff',
                border: msg.sender === 'system' ? 'none' : '1px solid #333',
                borderRadius: msg.sender === 'me' ? '15px 15px 2px 15px' : '15px 15px 15px 2px'
              }}>
                <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                   {msg.sender === 'system' && msg.text.startsWith('CONNECTED_VIA_') 
                    ? `> SYSTEM: MATCHED ON [ ${msg.text.split('_').pop()} ]` 
                    : msg.text}
                </Typography>
              </Paper>
            </Box>
          ))}
        </Box>

        <Box sx={{ p: isMobile ? 1.5 : 3, bgcolor: '#111', borderTop: '1px solid #222' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#000', border: '1px solid #333', borderRadius: '24px', px: 2 }}>
            <TextField 
              fullWidth 
              variant="standard" 
              placeholder="Type message..." 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} 
              InputProps={{ disableUnderline: true, sx: { color: '#fff', py: 1.2, fontSize: '0.9rem' } }} 
            />
            <IconButton 
              onClick={handleSendMessage} 
              disabled={!input.trim()} 
              sx={{ 
                color: '#00ff88', 
                bgcolor: input.trim() ? 'rgba(0, 255, 136, 0.1)' : 'transparent',
                ml: 1,
                transition: '0.3s'
              }}
            >
              <Send sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Chat;