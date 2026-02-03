import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { io } from 'socket.io-client';
import EmojiPicker from 'emoji-picker-react';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import Matching from '../Matching/Matching';
import {
  Box, Typography, TextField, IconButton, Divider,
  Paper, Chip, Button, Stack, useMediaQuery, useTheme, Drawer
} from '@mui/material';
import {
  Send, FiberManualRecord, Shield, ExitToApp, NavigateNext,
  Terminal, Menu as MenuIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router';
import { config } from "../../index";

const CENSORED_WORDS = [
  "fuck","shit","ass","asshole","bitch","bastard","nigger",
  "faggot","retard","slut","whore","porn","pussy","dick",
  "penis","vagina","cum"
];

class ChatFilter {
  constructor(words = CENSORED_WORDS) {
    this.words = words;
    this.map = { a:'[a@4*]', e:'[e3*]', i:'[i1!|*]', o:'[o0*]', u:'[u*]', s:'[s5$]', t:'[t7+]' };
    this.regex = new RegExp(words.map(w => this.buildPattern(w)).join('|'), 'gi');
  }
  buildPattern(word) {
    return '\\b' + word.split('').map(c => this.map[c] || c).join('[\\W_]*') + '\\b';
  }
  normalize(text) { return text.replace(/[\W_]/g, '').toLowerCase(); }
  isClean(msg) { return !this.regex.test(msg); }
  cleanMessage(msg) { return msg.replace(this.regex, m => '*'.repeat(m.length)); }
}

const Chat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const socketRef = useRef(null);
  const scrollRef = useRef(null);
  const filter = useMemo(() => new ChatFilter(), []);

  const [roomId, setRoomId] = useState(null);
  const [isMatchmaking, setIsMatchmaking] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [partner, setPartner] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);

  const user = useMemo(() => {
    const raw = localStorage.getItem('aegis_user');
    return raw ? JSON.parse(raw) : null;
  }, []);

  const userId = user?._id || user?.data?._id;
  const userAvatar = location.state?.avatar || user?.avatar;

  const handleNext = useCallback(() => {
    if (!socketRef.current) return;
    if (roomId) localStorage.removeItem(`aegis_chat_${roomId}`);
    setMessages([]);
    setPartner(null);
    setRoomId(null);
    setIsMatchmaking(true);
    setDrawerOpen(false);
    socketRef.current.emit('requeue');
  }, [roomId]);

  const handleTerminate = useCallback(() => {
    if (roomId) localStorage.removeItem(`aegis_chat_${roomId}`);
    socketRef.current?.disconnect();
    socketRef.current = null;
    navigate('/');
  }, [navigate, roomId]);

  useEffect(() => {
    const init = async () => {
      const fp = await FingerprintJS.load();
      const res = await fp.get();

      if (!socketRef.current) {
        socketRef.current = io(config.backendPoint, { withCredentials: true });
      }

      socketRef.current.on('connect', () => {
        socketRef.current.emit('join_queue', {
          userId,
          deviceId: res.visitorId,
          username: user?.username || "Guest",
          bio: user?.bio || "",
          interests: user?.interests || [],
          avatar: userAvatar
        });
      });

      socketRef.current.on('match_found', (data) => {
        setRoomId(data.roomId);
        setPartner(data.partner);
        setIsMatchmaking(false);
        setMessages([{ text: data.notice, sender: 'system' }]);
      });

      socketRef.current.on('receive_message', (msg) => {
        setMessages(prev => [...prev, { ...msg, sender: 'them' }]);
      });

      socketRef.current.on('partner_disconnected', () => {
        setMessages(prev => [...prev, { text: "SIGNAL_LOST_TERMINATING", sender: 'system' }]);
        setTimeout(handleNext, 2000);
      });
    };

    init();
    return () => socketRef.current?.removeAllListeners();
  }, [userId, user, userAvatar, handleNext]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const handleSendMessage = () => {
    if (!input.trim() || !roomId) return;
    if (!filter.isClean(input) || !filter.isClean(filter.normalize(input))) {
      alert("Blocked.");
      setInput("");
      return;
    }

    const msg = {
      roomId,
      text: filter.cleanMessage(input),
      sender: 'me',
      time: new Date().toLocaleTimeString()
    };

    socketRef.current.emit('send_message', msg);
    setMessages(prev => [...prev, msg]);
    setInput("");
    setShowEmoji(false);
  };

  if (isMatchmaking) return <Matching />;

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#0a0a0a', color: '#fff', position: 'relative' }}>
      <Box ref={scrollRef} sx={{ flexGrow: 1, overflowY: 'auto', p: 3 }}>
        {messages.map((msg, i) => (
          <Box key={i} sx={{ textAlign: msg.sender === 'me' ? 'right' : 'left', mb: 2 }}>
            <Paper sx={{ display: 'inline-block', p: '10px 16px', bgcolor: msg.sender === 'me' ? '#007bff' : '#161616', borderRadius: 3 }}>
              <Typography variant="body2">{msg.text}</Typography>
            </Paper>
          </Box>
        ))}
      </Box>

      {showEmoji && (
        <Box sx={{ position: 'absolute', bottom: 90, right: 24, zIndex: 2000 }}>
          <EmojiPicker
            theme="dark"
            height={350}
            width={300}
            onEmojiClick={(e) => setInput(prev => prev + e.emoji)}
          />
        </Box>
      )}

      <Box sx={{ p: 2, bgcolor: '#111' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#000', borderRadius: '24px', px: 2 }}>
          <TextField
            fullWidth
            variant="standard"
            placeholder="Type message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            InputProps={{ disableUnderline: true, sx: { color: '#fff' } }}
          />
          <IconButton onClick={() => setShowEmoji(p => !p)} sx={{ color: '#888' }}>
            <EmojiEmotionsIcon />
          </IconButton>
          <IconButton onClick={handleSendMessage} disabled={!input.trim()} sx={{ color: '#00ff88' }}>
            <Send />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default Chat;
