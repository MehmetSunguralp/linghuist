import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box,
  Typography,
  Avatar,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Badge,
  CircularProgress,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  useMediaQuery,
} from '@mui/material';
import {
  Send as SendIcon,
  PhotoCamera as PhotoCameraIcon,
  ArrowBack as ArrowBackIcon,
  Check as CheckIcon,
  DoneAll as DoneAllIcon,
  AccessTime as AccessTimeIcon,
  Warning as WarningIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  ContentCopy as ContentCopyIcon,
  Spellcheck as SpellcheckIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useAppSelector } from '@/store/hooks';
import { useSocket } from '@/hooks/useSocket';
import {
  MY_CHATS_QUERY,
  GET_MESSAGES_QUERY,
  USER_BY_USERNAME_QUERY,
} from '@/api/queries';
import {
  CLEAR_CHAT_MUTATION,
  EDIT_MESSAGE_MUTATION,
  DELETE_MESSAGE_MUTATION,
  CORRECT_MESSAGE_MUTATION,
} from '@/api/mutations';
import { getSupabaseStorageUrl, uploadImage } from '@/utils/supabaseStorage';
import { compressImageTo250KB } from '@/utils/imageCompression';
import FlagIcon from '@/components/FlagIcon';
import type { Chat, ChatParticipant, Message } from '@/types';
import { MessageType as MessageTypeEnum } from '@/types/MessageTypes';

interface ChatListItem {
  chat: Chat;
  otherUser: ChatParticipant['user'];
  lastMessage?: Message;
  unreadCount: number;
}

const ChatPage = () => {
  const { username } = useParams<{ username?: string }>();
  const navigate = useNavigate();
  const { user: currentUser, accessToken } = useAppSelector(
    (state) => state.auth,
  );
  const { socket, isConnected } = useSocket();
  const isSmallMobile = useMediaQuery('(max-width: 480px)');

  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [otherUser, setOtherUser] = useState<any>(null);
  const [otherUserAvatar, setOtherUserAvatar] = useState<string>('');
  const [typing, setTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [chatListAvatars, setChatListAvatars] = useState<
    Record<string, string>
  >({});
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({}); // chatId -> userId who is typing
  const [messageStatus, setMessageStatus] = useState<
    Record<string, 'sending' | 'sent' | 'read' | 'error'>
  >({}); // messageId -> status
  const [failedMessages, setFailedMessages] = useState<Record<string, Message>>(
    {},
  ); // messageId -> message for retry
  const [typingAnimation, setTypingAnimation] = useState(0); // For typing animation
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [messageMenuAnchor, setMessageMenuAnchor] = useState<{
    element: HTMLElement;
    message: Message;
  } | null>(null);
  const [correctingMessage, setCorrectingMessage] = useState<Message | null>(
    null,
  );
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingAnimationRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previousChatIdRef = useRef<string | null>(null);
  const isLoadingOlderMessagesRef = useRef(false);
  const creatingChatRef = useRef<string | null>(null); // Track which user we're creating a chat with
  const messageInputRef = useRef<HTMLInputElement>(null);
  const clearingChatRef = useRef<string | null>(null); // Track if we're clearing a chat to prevent recreation

  // Fetch chats
  const {
    data: chatsData,
    loading: chatsLoading,
    refetch: refetchChats,
  } = useQuery(MY_CHATS_QUERY, {
    variables: { userId: currentUser?.id },
    skip: !currentUser?.id,
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  });

  // Fetch messages for selected chat
  const {
    data: messagesData,
    loading: messagesLoading,
    fetchMore,
    refetch: refetchMessages,
  } = useQuery(GET_MESSAGES_QUERY, {
    variables: { chatId: selectedChat?.id, take: 30 },
    skip: !selectedChat?.id,
    fetchPolicy: 'cache-and-network', // Changed to ensure it always fetches
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
  });

  // Mutations
  const [clearChat] = useMutation(CLEAR_CHAT_MUTATION);
  const [editMessage] = useMutation(EDIT_MESSAGE_MUTATION);
  const [deleteMessage] = useMutation(DELETE_MESSAGE_MUTATION);
  const [correctMessage] = useMutation(CORRECT_MESSAGE_MUTATION);

  // Update messages when messagesData changes and mark as read
  useEffect(() => {
    if (messagesData?.getMessages?.messages && selectedChat) {
      const newMessages = messagesData.getMessages.messages;
      console.log('Messages data received:', {
        messageCount: newMessages.length,
        selectedChatId: selectedChat.id,
        isInitialLoad,
        currentMessagesCount: messages.length,
        messagesDataStructure: messagesData.getMessages,
      });

      // Always set messages if it's initial load or messages are empty
      // This ensures messages are set even if they were cleared
      // Use a ref to track if we should force update
      const shouldSetMessages = isInitialLoad || messages.length === 0;

      if (shouldSetMessages) {
        // Initial load - replace all messages
        console.log(
          'Setting initial messages:',
          newMessages.length,
          'messages',
        );
        if (newMessages && newMessages.length > 0) {
          setMessages(newMessages);
          console.log('Messages state updated with:', newMessages.length);
        } else {
          console.log('No messages to set (empty array)');
        }
        setIsInitialLoad(false);
      } else {
        // This is for new messages coming in via WebSocket or when chat changes
        // Merge with existing messages, avoiding duplicates
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const uniqueNew = newMessages.filter(
            (m: Message) => !existingIds.has(m.id),
          );
          // Sort by createdAt to maintain order
          const merged = [...prev, ...uniqueNew].sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );
          return merged;
        });
      }

      // Update pagination state
      setHasMoreMessages(messagesData.getMessages.hasMore || false);
      setNextCursor(messagesData.getMessages.nextCursor || null);

      // Mark all unread messages as read (only if socket and currentUser are available)
      if (socket && currentUser) {
        const unreadMessages = newMessages.filter(
          (m: Message) => !m.read && m.senderId !== currentUser.id,
        );
        for (const msg of unreadMessages) {
          socket.emit('message_read', { messageId: msg.id });
        }

        // Update message statuses for our own messages - prioritize server data
        const statusUpdates: Record<
          string,
          'sending' | 'sent' | 'read' | 'error'
        > = {};
        for (const msg of newMessages) {
          if (msg.senderId === currentUser.id) {
            // Use server's read status if available
            statusUpdates[msg.id] = msg.read === true ? 'read' : 'sent';
          }
        }
        setMessageStatus((prev) => ({ ...prev, ...statusUpdates }));
      }
    } else {
      console.log('Messages not set because:', {
        hasMessagesData: !!messagesData?.getMessages?.messages,
        hasSelectedChat: !!selectedChat,
        messagesDataKeys: messagesData ? Object.keys(messagesData) : null,
      });
    }
  }, [messagesData, selectedChat?.id, socket, currentUser?.id]);

  // Fallback: If we have messagesData but messages are empty, set them
  useEffect(() => {
    if (
      messagesData?.getMessages?.messages &&
      messagesData.getMessages.messages.length > 0 &&
      selectedChat &&
      messages.length === 0 &&
      !messagesLoading
    ) {
      console.log('Fallback: Setting messages from data (messages were empty)');
      setMessages(messagesData.getMessages.messages);
      setIsInitialLoad(false);
      setHasMoreMessages(messagesData.getMessages.hasMore || false);
      setNextCursor(messagesData.getMessages.nextCursor || null);
    }
  }, [messagesData, selectedChat?.id, messages.length, messagesLoading]);

  // Refetch messages when selectedChat changes (e.g., when navigating back to page)
  useEffect(() => {
    if (selectedChat?.id && selectedChat.id !== previousChatIdRef.current) {
      previousChatIdRef.current = selectedChat.id;
      // Reset initial load state
      setIsInitialLoad(true);
      setHasScrolledToBottom(false); // Reset scroll state
      setMessages([]);
      setNextCursor(null);
      setHasMoreMessages(false);
      // Small delay to ensure state is updated, then refetch
      const timeoutId = setTimeout(() => {
        if (refetchMessages && selectedChat.id) {
          console.log('Refetching messages for chat:', selectedChat.id);
          refetchMessages({ chatId: selectedChat.id, take: 30 })
            .then((result) => {
              console.log(
                'Refetch completed:',
                result.data?.getMessages?.messages?.length || 0,
                'messages',
              );
            })
            .catch((error) => {
              console.error('Failed to refetch messages:', error);
            });
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedChat?.id, refetchMessages]);

  // Fetch other user by username if provided
  const { data: userData, loading: userLoading } = useQuery(
    USER_BY_USERNAME_QUERY,
    {
      variables: { username },
      skip: !username,
      fetchPolicy: 'network-only',
    },
  );

  // Process chats data
  useEffect(() => {
    if (chatsData?.myChats) {
      const processedChats: ChatListItem[] = chatsData.myChats
        .map((chat: Chat) => {
          const otherParticipant = chat.participants?.find(
            (p) => p.userId !== currentUser?.id,
          );
          const lastMessage = chat.messages?.[0];
          const unreadCount =
            chat.messages?.filter(
              (m) => !m.read && m.senderId !== currentUser?.id,
            ).length || 0;

          // Add user to onlineUsers if they're online (from database)
          if (otherParticipant?.user?.isOnline && otherParticipant.user?.id) {
            setOnlineUsers((prev) => {
              const newSet = new Set(prev);
              newSet.add(otherParticipant.user!.id);
              return newSet;
            });
          }

          return {
            chat,
            otherUser: otherParticipant?.user,
            lastMessage,
            unreadCount,
          };
        })
        // Deduplicate by other user ID - keep the most recent chat if duplicates exist
        .filter((item: ChatListItem, index: number, self: ChatListItem[]) => {
          if (!item.otherUser?.id) return true;
          const firstIndex = self.findIndex(
            (i: ChatListItem) => i.otherUser?.id === item.otherUser?.id,
          );
          // Keep only the first occurrence (most recent due to orderBy in query)
          return firstIndex === index;
        });

      setChats(processedChats);

      // Fetch thumbnails for chat list (always use thumbnails)
      const fetchAvatars = async () => {
        const avatarMap: Record<string, string> = {};
        for (const item of processedChats) {
          if (item.otherUser && accessToken) {
            // Always use thumbnail URL - thumbnails always exist
            const imagePath = item.otherUser.userThumbnailUrl;
            if (imagePath) {
              try {
                const url = await getSupabaseStorageUrl(
                  imagePath,
                  'userThumbnails',
                  accessToken,
                );
                if (url && item.otherUser.id) {
                  avatarMap[item.otherUser.id] = url;
                }
              } catch (error) {
                console.error('Failed to get thumbnail URL:', error);
              }
            }
          }
        }
        setChatListAvatars(avatarMap);
      };

      if (processedChats.length > 0 && accessToken) {
        fetchAvatars();
      }

      // If username is provided, find and select that chat
      if (username && userData?.userByUsername) {
        const targetChat = processedChats.find(
          (item) => item.otherUser?.username === username,
        );
        if (targetChat) {
          setSelectedChat(targetChat.chat);
          setOtherUser(targetChat.otherUser);
          // Join the chat room if socket is connected
          if (socket && isConnected) {
            socket.emit('join_chat', { chatId: targetChat.chat.id });
          }
        } else {
          // Set otherUser first so it's available when chat is created
          setOtherUser(userData.userByUsername);
          // Create or get chat with this user when socket is ready
          // Only emit if we're not already creating a chat with this user
          if (
            socket &&
            isConnected &&
            userData.userByUsername.id &&
            creatingChatRef.current !== userData.userByUsername.id &&
            clearingChatRef.current !== userData.userByUsername.id
          ) {
            creatingChatRef.current = userData.userByUsername.id;
            socket.emit('create_or_get_chat', {
              otherUserId: userData.userByUsername.id,
            });
          }
        }
      }
    }
  }, [chatsData, username, userData, currentUser?.id, socket, isConnected]);

  // Set other user when userData changes
  useEffect(() => {
    if (userData?.userByUsername && username) {
      setOtherUser(userData.userByUsername);
    }
  }, [userData, username]);

  // Create chat when socket becomes connected and we have a username but no chat
  useEffect(() => {
    if (
      username &&
      userData?.userByUsername?.id &&
      socket &&
      isConnected &&
      !selectedChat
    ) {
      // Make sure otherUser is set
      if (!otherUser || otherUser.id !== userData.userByUsername.id) {
        setOtherUser(userData.userByUsername);
      }

      // Check if chat already exists in the list
      const existingChat = chats.find(
        (item) =>
          item.otherUser?.username === username ||
          item.otherUser?.id === userData.userByUsername.id,
      );

      if (!existingChat) {
        // Create or get chat with this user
        // Only emit if we're not already creating a chat with this user
        // AND we're not currently clearing a chat with this user
        if (
          creatingChatRef.current !== userData.userByUsername.id &&
          clearingChatRef.current !== userData.userByUsername.id
        ) {
          console.log('Creating chat with user:', userData.userByUsername.id);
          creatingChatRef.current = userData.userByUsername.id;
          socket.emit('create_or_get_chat', {
            otherUserId: userData.userByUsername.id,
          });
        }
      } else {
        // Chat exists, select it
        console.log('Found existing chat, selecting it');
        setSelectedChat(existingChat.chat);
        setOtherUser(existingChat.otherUser);
        socket.emit('join_chat', { chatId: existingChat.chat.id });
      }
    }
  }, [socket, isConnected, username, userData, selectedChat, otherUser, chats]);

  // Fetch other user thumbnail (always use thumbnails)
  useEffect(() => {
    const fetchAvatar = async () => {
      if (otherUser && accessToken) {
        // Always use thumbnail URL - thumbnails always exist
        const imagePath = otherUser.userThumbnailUrl;
        if (imagePath) {
          try {
            const url = await getSupabaseStorageUrl(
              imagePath,
              'userThumbnails',
              accessToken,
            );
            setOtherUserAvatar(url || '');
          } catch (error) {
            console.error('Failed to get thumbnail URL:', error);
            setOtherUserAvatar('');
          }
        } else {
          setOtherUserAvatar('');
        }
      } else {
        setOtherUserAvatar('');
      }
    };

    if (otherUser) {
      fetchAvatar();
    }
  }, [otherUser?.userThumbnailUrl, otherUser?.id, accessToken]);

  // WebSocket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleChat = (data: { chatId: string; messages: Message[] }) => {
      // Reset the creating chat ref since we got a response
      creatingChatRef.current = null;

      // Create or update the selected chat
      const chatToSet: Chat = {
        id: data.chatId,
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: data.messages,
      };
      setSelectedChat(chatToSet);
      setIsInitialLoad(true); // Reset for new chat
      setMessages(data.messages || []);

      // Join the chat room
      socket.emit('join_chat', { chatId: data.chatId });

      // If we have a username in the URL and userData, make sure otherUser is set
      if (username && userData?.userByUsername) {
        setOtherUser(userData.userByUsername);

        // Add new chat to the list if it doesn't exist
        // Check both by chat ID and by other user ID to prevent duplicates
        setChats((prev) => {
          const existsById = prev.some((item) => item.chat.id === data.chatId);
          const existsByUser = prev.some(
            (item) => item.otherUser?.id === userData.userByUsername.id,
          );
          if (!existsById && !existsByUser && userData.userByUsername) {
            // Fetch avatar/thumbnail for new chat
            const imagePath =
              userData.userByUsername.userThumbnailUrl ||
              userData.userByUsername.avatarUrl;
            if (imagePath && accessToken) {
              const bucket = userData.userByUsername.userThumbnailUrl
                ? 'userThumbnails'
                : 'avatars';
              getSupabaseStorageUrl(imagePath, bucket, accessToken)
                .then((url) => {
                  if (url && userData.userByUsername.id) {
                    setChatListAvatars((prevAvatars) => ({
                      ...prevAvatars,
                      [userData.userByUsername.id]: url,
                    }));
                  }
                })
                .catch((error) => {
                  console.error('Failed to get avatar URL:', error);
                });
            }

            return [
              {
                chat: chatToSet,
                otherUser: userData.userByUsername,
                lastMessage: data.messages?.at(-1),
                unreadCount: 0,
              },
              ...prev,
            ];
          }
          return prev;
        });
      }

      // Mark all unread messages as read when entering chat
      if (data.messages && currentUser) {
        const unreadMessages = data.messages.filter(
          (m) => !m.read && m.senderId !== currentUser.id,
        );
        for (const msg of unreadMessages) {
          if (socket) {
            socket.emit('message_read', { messageId: msg.id });
          }
        }
      }

      // Refetch chats to update the list
      refetchChats();
    };

    const handleMessage = (message: Message) => {
      // If this is a new message from server, remove any temp message with same content
      if (message.senderId === currentUser?.id) {
        setMessages((prev) => {
          // Remove temp messages
          const filtered = prev.filter((m) => !m.id.startsWith('temp-'));
          // Avoid duplicates
          if (filtered.some((m) => m.id === message.id)) {
            return filtered;
          }
          return [...filtered, message];
        });

        // Update message status - prioritize server's read status
        setMessageStatus((prev) => {
          const updated = { ...prev };
          // Remove temp statuses
          for (const key of Object.keys(updated)) {
            if (key.startsWith('temp-')) {
              delete updated[key];
            }
          }
          // Use server's read status
          updated[message.id] = message.read === true ? 'read' : 'sent';
          return updated;
        });
      } else {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === message.id)) {
            return prev;
          }
          return [...prev, message];
        });
      }

      // Always scroll to bottom when a new message arrives
      setTimeout(() => {
        const container = chatContainerRef.current;
        if (container) {
          container.scrollTop = container.scrollHeight;
        } else {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);

      // Update chat list with new message
      setChats((prev) =>
        prev.map((item) => {
          if (item.chat.id === message.chatId) {
            // Only increment unread count if message is not read and chat is not selected
            const shouldIncrement =
              message.senderId !== currentUser?.id &&
              !message.read &&
              selectedChat?.id !== message.chatId;

            return {
              ...item,
              lastMessage: message,
              unreadCount: shouldIncrement
                ? item.unreadCount + 1
                : item.unreadCount,
            };
          }
          return item;
        }),
      );

      // Mark as read if it's the current chat
      if (
        selectedChat?.id === message.chatId &&
        message.senderId !== currentUser?.id
      ) {
        socket.emit('message_read', { messageId: message.id });
      }
    };

    const handleMessageRead = (data: {
      messageId: string;
      chatId: string;
      readerId: string;
    }) => {
      console.log('Message read event:', data);
      // Update message read status and check if it's our message
      setMessages((prev) => {
        const updated = prev.map((msg) => {
          if (msg.id === data.messageId) {
            const updatedMsg = { ...msg, read: true };
            // If this is our message, update status to 'read'
            if (msg.senderId === currentUser?.id) {
              setMessageStatus((prevStatus) => ({
                ...prevStatus,
                [data.messageId]: 'read',
              }));
              console.log('Updated message status to read:', data.messageId);
            }
            return updatedMsg;
          }
          return msg;
        });
        return updated;
      });

      // Update unread count in chat list
      setChats((prev) =>
        prev.map((item) => {
          if (item.chat.id === data.chatId) {
            return {
              ...item,
              unreadCount: Math.max(0, item.unreadCount - 1),
            };
          }
          return item;
        }),
      );
    };

    const handleTyping = (data: { chatId: string; userId: string }) => {
      // Update typing status for the chat list
      setTypingUsers((prev) => ({
        ...prev,
        [data.chatId]: data.userId,
      }));
    };

    const handleStopTyping = (data: { chatId: string; userId: string }) => {
      // Remove typing status from chat list
      setTypingUsers((prev) => {
        const updated = { ...prev };
        delete updated[data.chatId];
        return updated;
      });
    };

    const handleUserOnline = (data: { userId: string }) => {
      console.log('User online event received:', data.userId);
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.add(data.userId);
        console.log('Online users set:', Array.from(newSet));
        return newSet;
      });
    };

    const handleUserOffline = (data: { userId: string }) => {
      console.log('User offline event received:', data.userId);
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        console.log('Online users set:', Array.from(newSet));
        return newSet;
      });
    };

    const handleChatCleared = (data: {
      chatId: string;
      clearedBy?: string;
    }) => {
      // Find the other user's ID before clearing to prevent recreation
      const chatToClear = chats.find((item) => item.chat.id === data.chatId);
      const otherUserId = chatToClear?.otherUser?.id;

      // Mark that we're clearing this chat to prevent recreation
      if (otherUserId) {
        clearingChatRef.current = otherUserId;
      }

      // Clear messages if this chat is selected
      if (selectedChat?.id === data.chatId) {
        setMessages([]);
      }
      // Remove chat from list (since it has no messages)
      setChats((prev) => prev.filter((item) => item.chat.id !== data.chatId));
      // If cleared chat was selected, clear selection and navigate away from username URL
      if (selectedChat?.id === data.chatId) {
        setSelectedChat(null);
        setOtherUser(null);
        navigate('/chat', { replace: true }); // Use replace to remove username from URL
      }
      // Refetch chats to ensure both users see the update
      refetchChats();

      // Clear the clearing flag after a delay to allow navigation to complete
      setTimeout(() => {
        clearingChatRef.current = null;
      }, 1000);
    };

    socket.on('chat', handleChat);
    socket.on('message', handleMessage);
    socket.on('message_read', handleMessageRead);
    socket.on('typing', handleTyping);
    socket.on('stop_typing', handleStopTyping);
    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);
    socket.on('chat_cleared', handleChatCleared);

    const handleMessageEdited = (data: {
      chatId: string;
      messageId: string;
      content: string;
      edited: boolean;
    }) => {
      // Update message in local state
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId
            ? { ...m, content: data.content, edited: data.edited }
            : m,
        ),
      );
    };

    const handleMessageCorrected = (data: {
      chatId: string;
      messageId: string;
      correction: string;
      originalContent: string | null;
      correctedBy: string;
    }) => {
      // Update message in local state
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId
            ? {
                ...m,
                correction: data.correction,
                originalContent: data.originalContent,
                correctedBy: data.correctedBy,
              }
            : m,
        ),
      );
    };

    socket.on('message_edited', handleMessageEdited);
    socket.on('message_corrected', handleMessageCorrected);

    return () => {
      socket.off('chat', handleChat);
      socket.off('message', handleMessage);
      socket.off('message_read', handleMessageRead);
      socket.off('typing', handleTyping);
      socket.off('stop_typing', handleStopTyping);
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
      socket.off('chat_cleared', handleChatCleared);
      socket.off('message_edited', handleMessageEdited);
      socket.off('message_corrected', handleMessageCorrected);
    };
  }, [
    socket,
    selectedChat,
    currentUser?.id,
    username,
    userData,
    otherUser,
    refetchChats,
    typingUsers,
    accessToken,
  ]);

  // Leave chat when component unmounts or chat changes
  useEffect(() => {
    return () => {
      if (socket && selectedChat) {
        socket.emit('leave_chat', { chatId: selectedChat.id });
      }
    };
  }, [socket, selectedChat?.id]);

  // Scroll to bottom on initial load and when new messages arrive (but not when loading older messages)
  useEffect(() => {
    // Don't scroll if we're loading older messages
    if (loadingMoreMessages || isLoadingOlderMessagesRef.current) {
      return;
    }

    if (messages.length > 0) {
      // Wait for DOM to render, then scroll to bottom
      const scrollToBottom = () => {
        const container = chatContainerRef.current;
        if (container) {
          // Direct scroll assignment for immediate effect
          container.scrollTop = container.scrollHeight;
          // Double-check with requestAnimationFrame to ensure it worked
          requestAnimationFrame(() => {
            if (container) {
              container.scrollTop = container.scrollHeight;
              // Only mark as scrolled after the animation frame completes
              setHasScrolledToBottom(true);
            }
          });
        } else if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
          // Mark as scrolled after a small delay to ensure scroll completed
          setTimeout(() => {
            setHasScrolledToBottom(true);
          }, 100);
        }
      };

      // Use a small delay to ensure DOM is fully rendered
      // Longer delay for initial load to ensure all messages are rendered
      const delay = isInitialLoad ? 200 : 50;
      const timeoutId = setTimeout(scrollToBottom, delay);
      return () => clearTimeout(timeoutId);
    }
  }, [messages.length, loadingMoreMessages, isInitialLoad]);

  // Load more messages (older messages)
  const loadMoreMessages = useCallback(async () => {
    if (
      !selectedChat?.id ||
      !nextCursor ||
      loadingMoreMessages ||
      !hasMoreMessages
    ) {
      return;
    }

    setLoadingMoreMessages(true);
    isLoadingOlderMessagesRef.current = true;
    const container = chatContainerRef.current;
    const previousScrollHeight = container?.scrollHeight || 0;

    try {
      const result = await fetchMore({
        variables: {
          chatId: selectedChat.id,
          take: 50,
          cursor: nextCursor,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult?.getMessages) {
            return prev;
          }

          const prevMessages = prev.getMessages?.messages || [];
          const newMessages = fetchMoreResult.getMessages.messages || [];

          // Merge messages, avoiding duplicates
          const existingIds = new Set(prevMessages.map((m: Message) => m.id));
          const uniqueNew = newMessages.filter(
            (m: Message) => !existingIds.has(m.id),
          );

          // Combine: new older messages first, then existing messages
          const merged = [...uniqueNew, ...prevMessages];

          return {
            ...prev,
            getMessages: {
              ...fetchMoreResult.getMessages,
              messages: merged,
            },
          };
        },
      });

      // Restore scroll position after loading
      if (container) {
        const newScrollHeight = container.scrollHeight;
        const scrollDifference = newScrollHeight - previousScrollHeight;
        container.scrollTop = scrollDifference;
      }

      // Update pagination state
      if (result.data?.getMessages) {
        setHasMoreMessages(result.data.getMessages.hasMore || false);
        setNextCursor(result.data.getMessages.nextCursor || null);
      }
    } catch (error) {
      console.error('Failed to load more messages:', error);
    } finally {
      setLoadingMoreMessages(false);
      // Reset the ref after a delay to allow scroll position to be restored
      // and prevent auto-scroll when messages update
      setTimeout(() => {
        isLoadingOlderMessagesRef.current = false;
      }, 500);
    }
  }, [
    selectedChat?.id,
    nextCursor,
    loadingMoreMessages,
    hasMoreMessages,
    fetchMore,
  ]);

  // Handle scroll to top for loading more messages
  useEffect(() => {
    const container = chatContainerRef.current;
    if (
      !container ||
      !selectedChat ||
      loadingMoreMessages ||
      !hasMoreMessages ||
      !nextCursor
    ) {
      return;
    }

    const handleScroll = () => {
      // Check if scrolled to top (within 50px)
      if (container.scrollTop < 50) {
        loadMoreMessages();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [
    selectedChat,
    loadingMoreMessages,
    hasMoreMessages,
    nextCursor,
    loadMoreMessages,
  ]);

  // Typing animation effect
  useEffect(() => {
    const isUserTyping =
      selectedChat &&
      typingUsers[selectedChat.id] &&
      typingUsers[selectedChat.id] === otherUser?.id;
    if (isUserTyping) {
      typingAnimationRef.current = setInterval(() => {
        setTypingAnimation((prev) => (prev + 1) % 4);
      }, 500);
    } else {
      if (typingAnimationRef.current) {
        clearInterval(typingAnimationRef.current);
        typingAnimationRef.current = null;
      }
      setTypingAnimation(0);
    }
    return () => {
      if (typingAnimationRef.current) {
        clearInterval(typingAnimationRef.current);
      }
    };
  }, [selectedChat, typingUsers, otherUser?.id]);

  // Handle typing indicator
  const handleInputChange = (value: string) => {
    setMessageInput(value);

    if (socket && selectedChat && !typing) {
      setTyping(true);
      socket.emit('typing', { chatId: selectedChat.id });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Only stop typing if input is empty and 3 seconds have passed
    typingTimeoutRef.current = setTimeout(() => {
      if (socket && selectedChat && !value.trim()) {
        setTyping(false);
        socket.emit('stop_typing', { chatId: selectedChat.id });
      }
    }, 3000);
  };

  // Send text message
  const handleSendMessage = async () => {
    // If in correction or edit mode, handle that instead
    if (correctingMessage) {
      await handleCorrectMessage(messageInput.trim());
      return;
    }
    if (editingMessage) {
      await handleEditMessage(editingMessage, messageInput.trim());
      return;
    }

    if (
      !messageInput.trim() ||
      !selectedChat ||
      !socket ||
      !currentUser ||
      sending
    ) {
      return;
    }

    const content = messageInput.trim();
    const tempMessageId = `temp-${Date.now()}`;

    // Create temporary message with sending status
    const tempMessage: Message = {
      id: tempMessageId,
      chatId: selectedChat.id,
      senderId: currentUser.id,
      receiverId: otherUser?.id || '',
      content,
      type: MessageTypeEnum.TEXT,
      createdAt: new Date(),
      read: false,
      sender: currentUser,
    };

    setMessageInput('');
    setSending(true);
    setMessageStatus((prev) => ({ ...prev, [tempMessageId]: 'sending' }));

    // Add temporary message to UI
    setMessages((prev) => [...prev, tempMessage]);

    if (typing && socket && selectedChat) {
      setTyping(false);
      socket.emit('stop_typing', { chatId: selectedChat.id });
    }

    try {
      socket.emit('send_message', {
        chatId: selectedChat.id,
        content,
        type: MessageTypeEnum.TEXT,
        receiverId: otherUser?.id,
      });

      // Message will be updated when server responds via handleMessage
      // Remove temp message when real message arrives
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessageStatus((prev) => ({ ...prev, [tempMessageId]: 'error' }));
      setFailedMessages((prev) => ({ ...prev, [tempMessageId]: tempMessage }));
      // Remove temp message and add to failed
      setMessages((prev) => prev.filter((m) => m.id !== tempMessageId));
    } finally {
      setSending(false);
    }
  };

  // Resend failed message
  const handleResendMessage = async (failedMessage: Message) => {
    if (!selectedChat || !socket || !currentUser || sending) {
      return;
    }

    setSending(true);
    const tempMessageId = `temp-${Date.now()}`;
    setMessageStatus((prev) => ({ ...prev, [tempMessageId]: 'sending' }));

    try {
      socket.emit('send_message', {
        chatId: selectedChat.id,
        content: failedMessage.content,
        type: failedMessage.type,
        receiverId: otherUser?.id,
      });

      // Remove from failed messages
      setFailedMessages((prev) => {
        const updated = { ...prev };
        delete updated[failedMessage.id];
        return updated;
      });
    } catch (error) {
      console.error('Failed to resend message:', error);
      setMessageStatus((prev) => ({ ...prev, [tempMessageId]: 'error' }));
    } finally {
      setSending(false);
    }
  };

  // Clear chat (delete all messages, keep chat)
  const handleClearChat = async () => {
    if (!chatToDelete || !currentUser) return;

    try {
      // Find the other user's ID before clearing to prevent recreation
      const chatToClear = chats.find((item) => item.chat.id === chatToDelete);
      const otherUserId = chatToClear?.otherUser?.id;

      // Mark that we're clearing this chat to prevent recreation
      if (otherUserId) {
        clearingChatRef.current = otherUserId;
      }

      await clearChat({
        variables: {
          chatId: chatToDelete,
          userId: currentUser.id,
        },
      });
      // Clear messages if this chat is selected
      if (selectedChat?.id === chatToDelete) {
        setMessages([]);
      }
      // Update chat list - remove the chat from list since it has no messages
      setChats((prev) => prev.filter((item) => item.chat.id !== chatToDelete));
      // If cleared chat was selected, clear selection and navigate away from username URL
      if (selectedChat?.id === chatToDelete) {
        setSelectedChat(null);
        setOtherUser(null);
        navigate('/chat', { replace: true }); // Use replace to remove username from URL
      }
      setDeleteDialogOpen(false);
      setChatToDelete(null);
      refetchChats();

      // Clear the clearing flag after a delay to allow navigation to complete
      setTimeout(() => {
        clearingChatRef.current = null;
      }, 1000);
    } catch (error) {
      console.error('Failed to clear chat:', error);
      clearingChatRef.current = null; // Reset on error
    }
  };

  // Edit message
  const handleEditMessage = async (message: Message, newContent: string) => {
    if (!currentUser || !socket || !selectedChat) return;

    // Stop typing if active
    if (typing) {
      setTyping(false);
      socket.emit('stop_typing', { chatId: selectedChat.id });
    }

    try {
      await editMessage({
        variables: {
          input: {
            messageId: message.id,
            content: newContent,
          },
          userId: currentUser.id,
        },
      });
      // Update local state
      setMessages((prev) =>
        prev.map((m) =>
          m.id === message.id ? { ...m, content: newContent, edited: true } : m,
        ),
      );
      setEditingMessage(null);
      setMessageInput('');
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  };

  // Delete message
  const handleDeleteMessage = async (message: Message) => {
    if (!currentUser) return;

    try {
      await deleteMessage({
        variables: {
          messageId: message.id,
          userId: currentUser.id,
        },
      });
      // Update local state
      setMessages((prev) =>
        prev.map((m) =>
          m.id === message.id ? { ...m, deleted: true, content: null } : m,
        ),
      );
      setMessageMenuAnchor(null);
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  // Correct message
  const handleCorrectMessage = async (correction: string) => {
    if (!correctingMessage || !currentUser || !socket || !selectedChat) return;

    // Stop typing if active
    if (typing) {
      setTyping(false);
      socket.emit('stop_typing', { chatId: selectedChat.id });
    }

    try {
      await correctMessage({
        variables: {
          input: {
            messageId: correctingMessage.id,
            correction: correction,
          },
          correctorId: currentUser.id,
        },
      });
      // Update local state
      setMessages((prev) =>
        prev.map((m) =>
          m.id === correctingMessage.id
            ? {
                ...m,
                correction: correction,
                originalContent: m.content ?? null,
                correctedBy: currentUser.id,
              }
            : m,
        ),
      );
      setCorrectingMessage(null);
      setMessageInput('');
    } catch (error) {
      console.error('Failed to correct message:', error);
    }
  };

  // Handle message menu click
  const handleMessageMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    message: Message,
  ) => {
    setMessageMenuAnchor({ element: event.currentTarget, message });
  };

  // Handle message menu close
  const handleMessageMenuClose = () => {
    setMessageMenuAnchor(null);
  };

  // Handle copy message
  const handleCopyMessage = (message: Message) => {
    if (message.content) {
      navigator.clipboard.writeText(message.content);
      setMessageMenuAnchor(null);
    }
  };

  // Handle start correction
  const handleStartCorrection = (message: Message) => {
    // Stop typing if active
    if (typing && socket && selectedChat) {
      setTyping(false);
      socket.emit('stop_typing', { chatId: selectedChat.id });
    }
    setCorrectingMessage(message);
    setMessageInput(message.content || '');
    setMessageMenuAnchor(null);
    // Focus input after state update
    setTimeout(() => {
      messageInputRef.current?.focus();
    }, 0);
  };

  // Check if message can be edited (less than 10 minutes old)
  const canEditMessage = (message: Message): boolean => {
    const messageTime = new Date(message.createdAt).getTime();
    const currentTime = Date.now();
    const tenMinutesInMs = 10 * 60 * 1000; // 10 minutes in milliseconds
    return currentTime - messageTime < tenMinutesInMs;
  };

  // Handle start edit
  const handleStartEdit = (message: Message) => {
    // Check if message can still be edited
    if (!canEditMessage(message)) {
      console.warn('Message is too old to edit (more than 10 minutes)');
      return;
    }
    // Stop typing if active
    if (typing && socket && selectedChat) {
      setTyping(false);
      socket.emit('stop_typing', { chatId: selectedChat.id });
    }
    setEditingMessage(message);
    setMessageInput(message.content || '');
    setMessageMenuAnchor(null);
    // Focus input after state update
    setTimeout(() => {
      messageInputRef.current?.focus();
    }, 0);
  };

  // Handle cancel correction/edit
  const handleCancelCorrection = () => {
    setCorrectingMessage(null);
    setEditingMessage(null);
    setMessageInput('');
  };

  // Handle photo upload
  const handlePhotoSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !selectedChat || !socket || !currentUser || sending) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    const tempMessageId = `temp-${Date.now()}`;
    setSending(true);
    setMessageStatus((prev) => ({ ...prev, [tempMessageId]: 'sending' }));

    try {
      // Compress image
      const compressedFile = await compressImageTo250KB(file);

      // Upload to Supabase
      const mediaUrl = await uploadImage(
        compressedFile,
        'chat-media',
        'messages',
        currentUser.id,
        accessToken || undefined,
      );

      // Create temporary message
      const tempMessage: Message = {
        id: tempMessageId,
        chatId: selectedChat.id,
        senderId: currentUser.id,
        receiverId: otherUser?.id || '',
        content: '',
        mediaUrl,
        type: MessageTypeEnum.IMAGE,
        createdAt: new Date(),
        read: false,
        sender: currentUser,
      };

      setMessages((prev) => [...prev, tempMessage]);

      // Send message with media
      socket.emit('send_message', {
        chatId: selectedChat.id,
        content: '',
        mediaUrl,
        type: MessageTypeEnum.IMAGE,
        receiverId: otherUser?.id,
      });
    } catch (error) {
      console.error('Failed to send photo:', error);
      setMessageStatus((prev) => ({ ...prev, [tempMessageId]: 'error' }));
      setFailedMessages((prev) => {
        const failedMsg: Message = {
          id: tempMessageId,
          chatId: selectedChat.id,
          senderId: currentUser.id,
          receiverId: otherUser?.id || '',
          content: '',
          mediaUrl: '',
          type: MessageTypeEnum.IMAGE,
          createdAt: new Date(),
          read: false,
          sender: currentUser,
        };
        return { ...prev, [tempMessageId]: failedMsg };
      });
      setMessages((prev) => prev.filter((m) => m.id !== tempMessageId));
      alert('Failed to send photo. Please try again.');
    } finally {
      setSending(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Select chat from list
  const handleChatSelect = (chat: Chat, otherUserData: any) => {
    setSelectedChat(chat);
    setOtherUser(otherUserData);
    setIsInitialLoad(true); // Reset for new chat
    setHasScrolledToBottom(false); // Reset scroll state
    setMessages([]); // Clear messages when switching chats
    setNextCursor(null);
    setHasMoreMessages(false);

    if (socket && isConnected) {
      socket.emit('join_chat', { chatId: chat.id });

      // Mark all unread messages as read
      if (chat.messages) {
        const unreadMessages = chat.messages.filter(
          (m) => !m.read && m.senderId !== currentUser?.id,
        );
        for (const msg of unreadMessages) {
          socket.emit('message_read', { messageId: msg.id });
        }
      }
    }

    // Reset unread count for this chat
    setChats((prev) =>
      prev.map((item) => {
        if (item.chat.id === chat.id) {
          return { ...item, unreadCount: 0 };
        }
        return item;
      }),
    );

    // Navigate to chat URL
    if (otherUserData?.username) {
      navigate(`/chat/${otherUserData.username}`, { replace: true });
    }

    // Note: Refetch is handled by the useEffect that watches selectedChat.id
    // No need to refetch here to avoid duplicate calls
  };

  // Get signed URL for message media
  const getMessageMediaUrl = async (mediaUrl: string): Promise<string> => {
    if (!mediaUrl) return '';
    if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
      return mediaUrl;
    }

    try {
      return await getSupabaseStorageUrl(
        mediaUrl,
        'chat-media',
        accessToken || undefined,
      );
    } catch (error) {
      console.error('Failed to get media URL:', error);
      return '';
    }
  };

  // Check both onlineUsers set and the user's isOnline property
  const isOtherUserOnline = otherUser
    ? onlineUsers.has(otherUser.id) || otherUser.isOnline
    : false;

  if (!currentUser) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80vh',
          width: '100%',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: {
          xs: 'calc(100dvh - 56px)', // Mobile header is typically 56px
          sm: 'calc(100vh - 64px)', // Desktop header is 64px
        },
        width: '100%',
        display: 'flex',
        overflow: 'hidden',
        maxHeight: {
          xs: 'calc(100dvh - 56px)',
          sm: 'calc(100vh - 64px)',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          height: '100%',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Chat List Sidebar */}
        <Paper
          sx={{
            width: { xs: isSmallMobile ? 60 : 80, sm: 350 },
            minWidth: { xs: isSmallMobile ? 60 : 80, sm: 350 },
            height: '100%',
            borderRadius: 0,
            borderRight: 1,
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            transition: 'width 0.3s ease',
            overflow: 'hidden',
          }}
        >
          {!isSmallMobile && (
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography
                variant="h6"
                sx={{ fontSize: { xs: '0.875rem', sm: '1.25rem' } }}
              >
                Messages
              </Typography>
            </Box>
          )}
          <List
            sx={{
              flex: 1,
              overflow: 'auto',
              p: 0,
              minHeight: 0, // Important for flexbox scrolling
            }}
          >
            {(() => {
              if (chatsLoading) {
                return (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress size={24} />
                  </Box>
                );
              }
              if (chats.length === 0) {
                return (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      No chats yet
                    </Typography>
                  </Box>
                );
              }
              return chats.map((item) => {
                const isSelected = selectedChat?.id === item.chat.id;
                // Check both onlineUsers set and the user's isOnline property
                const isOnline = item.otherUser
                  ? onlineUsers.has(item.otherUser.id) ||
                    item.otherUser.isOnline
                  : false;

                return (
                  <ListItem
                    key={item.chat.id}
                    onClick={() => handleChatSelect(item.chat, item.otherUser)}
                    secondaryAction={
                      !isSmallMobile && (
                        <IconButton
                          edge="end"
                          onClick={(e) => {
                            e.stopPropagation();
                            setChatToDelete(item.chat.id);
                            setDeleteDialogOpen(true);
                          }}
                          sx={{ mr: 1 }}
                          size="small"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )
                    }
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                      bgcolor: isSelected ? 'action.selected' : 'transparent',
                      px: { xs: isSmallMobile ? 1 : 1.5, sm: 2 },
                      py: { xs: 1, sm: 1.5 },
                    }}
                  >
                    <ListItemAvatar
                      sx={{ minWidth: { xs: isSmallMobile ? 40 : 48, sm: 56 } }}
                    >
                      <Box
                        sx={{ position: 'relative', display: 'inline-flex' }}
                      >
                        <Avatar
                          src={
                            item.otherUser?.id
                              ? chatListAvatars[item.otherUser.id]
                              : undefined
                          }
                          alt={item.otherUser?.username || ''}
                          sx={{
                            width: { xs: isSmallMobile ? 32 : 40, sm: 48 },
                            height: { xs: isSmallMobile ? 32 : 40, sm: 48 },
                            border: isOnline ? '2px solid #4caf50' : 'none',
                            boxSizing: 'border-box',
                            fontSize: {
                              xs: isSmallMobile ? '0.75rem' : '0.875rem',
                              sm: '1.25rem',
                            },
                          }}
                        >
                          {(item.otherUser?.username || 'U')[0].toUpperCase()}
                        </Avatar>
                        {item.otherUser?.country && (
                          <Box
                            sx={{
                              position: 'absolute',
                              bottom: 0,
                              right: 0,
                              width: { xs: isSmallMobile ? 14 : 16, sm: 20 },
                              height: { xs: isSmallMobile ? 14 : 16, sm: 20 },
                              borderRadius: '50%',
                              border: { xs: '1.5px solid', sm: '2px solid' },
                              borderColor: 'background.paper',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: 'background.paper',
                            }}
                          >
                            <FlagIcon
                              countryCode={item.otherUser.country}
                              size={isSmallMobile ? 10 : 14}
                            />
                          </Box>
                        )}
                        {item.unreadCount > 0 && (
                          <Badge
                            badgeContent={item.unreadCount}
                            color="primary"
                            sx={{
                              position: 'absolute',
                              top: -4,
                              right: -4,
                              '& .MuiBadge-badge': {
                                fontSize: { xs: '0.625rem', sm: '0.75rem' },
                                minWidth: { xs: 14, sm: 18 },
                                height: { xs: 14, sm: 18 },
                                padding: { xs: '0 4px', sm: '0 6px' },
                              },
                            }}
                          />
                        )}
                      </Box>
                    </ListItemAvatar>
                    {!isSmallMobile && (
                      <ListItemText
                        primary={
                          <Typography
                            variant="subtitle2"
                            noWrap
                            sx={{
                              flex: 1,
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            }}
                          >
                            {item.otherUser?.username || 'Unknown'}
                          </Typography>
                        }
                        secondary={
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              justifyContent: 'space-between',
                            }}
                          >
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              noWrap
                              sx={{
                                flex: 1,
                                fontSize: { xs: '0.7rem', sm: '0.875rem' },
                              }}
                            >
                              {item.lastMessage?.type === MessageTypeEnum.IMAGE
                                ? '📷 Photo'
                                : item.lastMessage?.content ||
                                  'No messages yet'}
                            </Typography>
                            {/* Show message status icons if last message is from current user */}
                            {item.lastMessage?.senderId === currentUser?.id && (
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  minWidth: 20,
                                }}
                              >
                                {(() => {
                                  const status =
                                    messageStatus[item.lastMessage.id];
                                  const isRead =
                                    item.lastMessage.read === true ||
                                    status === 'read';
                                  const messageStatusValue =
                                    status ||
                                    (item.lastMessage.read === true
                                      ? 'read'
                                      : 'sent');

                                  if (messageStatusValue === 'sending') {
                                    return (
                                      <AccessTimeIcon
                                        sx={{
                                          fontSize: { xs: 12, sm: 14 },
                                          opacity: 0.7,
                                        }}
                                      />
                                    );
                                  } else if (messageStatusValue === 'error') {
                                    return (
                                      <WarningIcon
                                        sx={{
                                          fontSize: { xs: 12, sm: 14 },
                                          color: 'error.main',
                                        }}
                                      />
                                    );
                                  } else if (
                                    isRead ||
                                    messageStatusValue === 'read'
                                  ) {
                                    return (
                                      <DoneAllIcon
                                        sx={{
                                          fontSize: { xs: 14, sm: 16 },
                                          opacity: 0.9,
                                        }}
                                      />
                                    );
                                  } else {
                                    return (
                                      <CheckIcon
                                        sx={{
                                          fontSize: { xs: 12, sm: 14 },
                                          opacity: 0.7,
                                        }}
                                      />
                                    );
                                  }
                                })()}
                              </Box>
                            )}
                          </Box>
                        }
                      />
                    )}
                  </ListItem>
                );
              });
            })()}
          </List>
        </Paper>

        {/* Chat Screen */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
            minWidth: 0, // Important for flexbox
          }}
        >
          {selectedChat && otherUser ? (
            <>
              {/* Chat Header */}
              <Paper
                sx={{
                  p: { xs: 1, sm: 2 },
                  borderBottom: 1,
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  gap: { xs: 1, sm: 2 },
                }}
              >
                <IconButton
                  onClick={() => navigate(-1)}
                  size={isSmallMobile ? 'small' : 'medium'}
                >
                  <ArrowBackIcon
                    fontSize={isSmallMobile ? 'small' : 'medium'}
                  />
                </IconButton>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: { xs: 1, sm: 2 },
                    flex: 1,
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate(`/profile/${otherUser.username}`)}
                >
                  <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                    <Avatar
                      src={otherUserAvatar}
                      alt={otherUser.username || ''}
                      sx={{
                        width: { xs: isSmallMobile ? 32 : 40, sm: 48 },
                        height: { xs: isSmallMobile ? 32 : 40, sm: 48 },
                        border: isOtherUserOnline
                          ? '2px solid #4caf50'
                          : 'none',
                        boxSizing: 'border-box',
                        fontSize: {
                          xs: isSmallMobile ? '0.75rem' : '0.875rem',
                          sm: '1.25rem',
                        },
                      }}
                    >
                      {(otherUser.username || 'U')[0].toUpperCase()}
                    </Avatar>
                    {otherUser.country && (
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: { xs: isSmallMobile ? 14 : 16, sm: 20 },
                          height: { xs: isSmallMobile ? 14 : 16, sm: 20 },
                          borderRadius: '50%',
                          border: { xs: '1.5px solid', sm: '2px solid' },
                          borderColor: 'background.paper',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'background.paper',
                        }}
                      >
                        <FlagIcon
                          countryCode={otherUser.country}
                          size={isSmallMobile ? 10 : 14}
                        />
                      </Box>
                    )}
                  </Box>
                  {!isSmallMobile && (
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="h6"
                        sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                      >
                        {otherUser.username || 'Unknown'}
                      </Typography>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                        >
                          {(() => {
                            const isUserTyping =
                              typingUsers[selectedChat.id] &&
                              typingUsers[selectedChat.id] === otherUser.id;
                            if (isUserTyping) {
                              const dots = '.'.repeat(
                                (typingAnimation % 3) + 1,
                              );
                              return `Typing${dots}`;
                            }
                            return isOtherUserOnline ? 'Online' : 'Offline';
                          })()}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Paper>

              {/* Messages Area */}
              <Box
                ref={chatContainerRef}
                sx={{
                  flex: 1,
                  overflow: 'auto',
                  p: { xs: 1, sm: 2 },
                  bgcolor: 'background.default',
                  position: 'relative',
                  minHeight: 0, // Important for flexbox scrolling
                  WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
                }}
              >
                {loadingMoreMessages && (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      p: 2,
                    }}
                  >
                    <CircularProgress size={24} />
                  </Box>
                )}
                {(() => {
                  if (
                    isInitialLoad &&
                    messagesLoading &&
                    !hasScrolledToBottom
                  ) {
                    return (
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          minHeight: '200px',
                          py: 4,
                        }}
                      >
                        <CircularProgress />
                      </Box>
                    );
                  }
                  if (messages.length === 0) {
                    return (
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          minHeight: '200px',
                          py: 4,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          No messages yet. Start the conversation!
                        </Typography>
                      </Box>
                    );
                  }
                  return (
                    <>
                      {messages.map((message) => {
                        const isOwn = message.senderId === currentUser?.id;

                        return (
                          <Box
                            key={message.id}
                            sx={{
                              display: 'flex',
                              justifyContent: isOwn ? 'flex-end' : 'flex-start',
                              mb: 2,
                            }}
                          >
                            <Paper
                              sx={{
                                p: { xs: 1, sm: 1.5 },
                                maxWidth: { xs: '85%', sm: '70%' },
                                bgcolor: isOwn
                                  ? 'primary.main'
                                  : 'background.paper',
                                color: isOwn
                                  ? 'primary.contrastText'
                                  : 'text.primary',
                                borderRadius: { xs: 1.5, sm: 2 },
                                position: 'relative',
                              }}
                            >
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: 1,
                                }}
                              >
                                <Box sx={{ flex: 1 }}>
                                  {message.deleted ? (
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontStyle: 'italic',
                                        opacity: 0.7,
                                        fontSize: {
                                          xs: '0.75rem',
                                          sm: '0.875rem',
                                        },
                                      }}
                                    >
                                      This message was deleted
                                    </Typography>
                                  ) : message.correction ? (
                                    <>
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          textDecoration: 'line-through',
                                          opacity: 0.7,
                                          mb: 0.5,
                                          fontSize: {
                                            xs: '0.75rem',
                                            sm: '0.875rem',
                                          },
                                        }}
                                      >
                                        {message.originalContent ||
                                          message.content}
                                      </Typography>
                                      <Typography
                                        variant="body1"
                                        sx={{
                                          fontSize: {
                                            xs: '0.875rem',
                                            sm: '1rem',
                                          },
                                        }}
                                      >
                                        {message.correction}
                                      </Typography>
                                    </>
                                  ) : message.type === MessageTypeEnum.IMAGE &&
                                    message.mediaUrl ? (
                                    <Box
                                      component="img"
                                      src={message.mediaUrl}
                                      alt="Message"
                                      sx={{
                                        maxWidth: '100%',
                                        borderRadius: 1,
                                        display: 'block',
                                      }}
                                      onError={async (e) => {
                                        // Try to get signed URL if direct URL fails
                                        const signedUrl =
                                          await getMessageMediaUrl(
                                            message.mediaUrl || '',
                                          );
                                        if (signedUrl && e.currentTarget) {
                                          e.currentTarget.src = signedUrl;
                                        }
                                      }}
                                    />
                                  ) : (
                                    <Typography
                                      variant="body1"
                                      sx={{
                                        fontSize: {
                                          xs: '0.875rem',
                                          sm: '1rem',
                                        },
                                      }}
                                    >
                                      {message.content}
                                    </Typography>
                                  )}
                                  {message.edited && (
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        opacity: 0.7,
                                        display: 'block',
                                        mt: 0.5,
                                        fontSize: {
                                          xs: '0.65rem',
                                          sm: '0.75rem',
                                        },
                                      }}
                                    >
                                      (edited)
                                    </Typography>
                                  )}
                                </Box>
                                {!message.deleted && (
                                  <IconButton
                                    size={isSmallMobile ? 'small' : 'small'}
                                    onClick={(e) =>
                                      handleMessageMenuClick(e, message)
                                    }
                                    sx={{
                                      opacity: 0.7,
                                      '&:hover': { opacity: 1 },
                                      p: { xs: 0.5, sm: 1 },
                                    }}
                                  >
                                    <MoreVertIcon
                                      fontSize={
                                        isSmallMobile ? 'small' : 'small'
                                      }
                                    />
                                  </IconButton>
                                )}
                              </Box>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'flex-end',
                                  gap: 0.5,
                                  mt: 0.5,
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{
                                    opacity: 0.7,
                                    fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                  }}
                                >
                                  {new Date(
                                    message.createdAt,
                                  ).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </Typography>
                                {isOwn && (
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                    }}
                                  >
                                    {(() => {
                                      // Check both messageStatus and message.read property
                                      const statusFromState =
                                        messageStatus[message.id];
                                      // Prioritize message.read from server, then status from state
                                      const isRead =
                                        message.read === true ||
                                        statusFromState === 'read';
                                      const status =
                                        statusFromState ||
                                        (message.read === true
                                          ? 'read'
                                          : 'sent');

                                      if (status === 'sending') {
                                        return (
                                          <AccessTimeIcon
                                            sx={{ fontSize: 14, opacity: 0.7 }}
                                          />
                                        );
                                      } else if (status === 'error') {
                                        const failedMsg =
                                          failedMessages[message.id];
                                        return (
                                          <Box
                                            sx={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: 0.5,
                                            }}
                                          >
                                            <WarningIcon
                                              sx={{
                                                fontSize: 14,
                                                color: 'error.main',
                                              }}
                                            />
                                            {failedMsg && (
                                              <IconButton
                                                size="small"
                                                onClick={() =>
                                                  handleResendMessage(failedMsg)
                                                }
                                                sx={{
                                                  p: 0.25,
                                                  minWidth: 'auto',
                                                }}
                                              >
                                                <SendIcon
                                                  sx={{ fontSize: 12 }}
                                                />
                                              </IconButton>
                                            )}
                                          </Box>
                                        );
                                      } else if (isRead || status === 'read') {
                                        return (
                                          <DoneAllIcon
                                            sx={{
                                              fontSize: 16,

                                              opacity: 0.9,
                                            }}
                                          />
                                        );
                                      } else {
                                        return (
                                          <CheckIcon
                                            sx={{ fontSize: 14, opacity: 0.7 }}
                                          />
                                        );
                                      }
                                    })()}
                                  </Box>
                                )}
                              </Box>
                            </Paper>
                          </Box>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  );
                })()}
              </Box>

              {/* Correction Preview */}
              {correctingMessage && (
                <Paper
                  sx={{
                    p: 1.5,
                    mx: 2,
                    mb: 1,
                    bgcolor: 'action.hover',
                    borderLeft: '3px solid',
                    borderColor: 'primary.main',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Correcting message:
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {correctingMessage.content}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={handleCancelCorrection}
                      sx={{ ml: 1 }}
                    >
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Paper>
              )}

              {/* Edit Preview */}
              {editingMessage && (
                <Paper
                  sx={{
                    p: 1.5,
                    mx: 2,
                    mb: 1,
                    bgcolor: 'action.hover',
                    borderLeft: '3px solid',
                    borderColor: 'primary.main',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Editing message:
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {editingMessage.content}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={handleCancelCorrection}
                      sx={{ ml: 1 }}
                    >
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Paper>
              )}

              {/* Message Input */}
              <Paper
                sx={{
                  p: { xs: 1, sm: 2 },
                  borderTop: 1,
                  borderColor: 'divider',
                  display: 'flex',
                  gap: { xs: 0.5, sm: 1 },
                  alignItems: 'center',
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handlePhotoSelect}
                />
                {!correctingMessage && (
                  <IconButton
                    color="primary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sending}
                    size={isSmallMobile ? 'small' : 'medium'}
                  >
                    <PhotoCameraIcon
                      fontSize={isSmallMobile ? 'small' : 'medium'}
                    />
                  </IconButton>
                )}
                <TextField
                  inputRef={messageInputRef}
                  fullWidth
                  placeholder={
                    correctingMessage
                      ? 'Enter correction...'
                      : editingMessage
                      ? 'Edit message...'
                      : 'Type a message...'
                  }
                  value={messageInput}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={sending || !isConnected}
                  size={isSmallMobile ? 'small' : 'medium'}
                  slotProps={{
                    input: {
                      sx: {
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        py: { xs: 1, sm: 1.5 },
                      },
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            color="primary"
                            onClick={handleSendMessage}
                            disabled={
                              !messageInput.trim() || sending || !isConnected
                            }
                            size={isSmallMobile ? 'small' : 'medium'}
                          >
                            {sending ? (
                              <CircularProgress
                                size={isSmallMobile ? 16 : 20}
                              />
                            ) : correctingMessage || editingMessage ? (
                              <CheckCircleIcon
                                fontSize={isSmallMobile ? 'small' : 'medium'}
                              />
                            ) : (
                              <SendIcon
                                fontSize={isSmallMobile ? 'small' : 'medium'}
                              />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Paper>
            </>
          ) : (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flex: 1,
                flexDirection: 'column',
                gap: 2,
                minHeight: 0,
              }}
            >
              <Typography variant="h6" color="text.secondary">
                {userLoading
                  ? 'Loading...'
                  : 'Select a chat to start messaging'}
              </Typography>
              {!isConnected && (
                <Typography variant="body2" color="error">
                  Connecting to server...
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </Box>

      {/* Delete Chat Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Chat</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this chat? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleClearChat} color="error" variant="contained">
            Clear Chat
          </Button>
        </DialogActions>
      </Dialog>

      {/* Message Menu */}
      <Menu
        anchorEl={messageMenuAnchor?.element}
        open={Boolean(messageMenuAnchor)}
        onClose={handleMessageMenuClose}
      >
        {messageMenuAnchor?.message.senderId === currentUser?.id ? (
          <>
            {messageMenuAnchor.message &&
              canEditMessage(messageMenuAnchor.message) && (
                <MenuItem
                  onClick={() => {
                    if (messageMenuAnchor?.message) {
                      handleStartEdit(messageMenuAnchor.message);
                    }
                  }}
                >
                  <ListItemIcon>
                    <EditIcon fontSize="small" />
                  </ListItemIcon>
                  Edit
                </MenuItem>
              )}
            <MenuItem
              onClick={() => {
                if (messageMenuAnchor?.message) {
                  handleDeleteMessage(messageMenuAnchor.message);
                }
              }}
            >
              <ListItemIcon>
                <DeleteIcon fontSize="small" />
              </ListItemIcon>
              Delete
            </MenuItem>
          </>
        ) : (
          <>
            <MenuItem
              onClick={() => {
                if (messageMenuAnchor?.message) {
                  handleCopyMessage(messageMenuAnchor.message);
                }
              }}
            >
              <ListItemIcon>
                <ContentCopyIcon fontSize="small" />
              </ListItemIcon>
              Copy
            </MenuItem>
            <MenuItem
              onClick={() => {
                if (messageMenuAnchor?.message) {
                  handleStartCorrection(messageMenuAnchor.message);
                }
              }}
            >
              <ListItemIcon>
                <SpellcheckIcon fontSize="small" />
              </ListItemIcon>
              Correct
            </MenuItem>
          </>
        )}
      </Menu>
    </Box>
  );
};

export default ChatPage;
