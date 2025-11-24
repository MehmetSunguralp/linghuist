import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  Container,
  Box,
  Typography,
  Avatar,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Paper,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Chip,
  Snackbar,
  Select,
  FormControl,
  InputLabel,
  ListItemText,
  OutlinedInput,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Close as CloseIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  Chat as ChatIcon,
  InfoOutline as InfoOutlineIcon,
  People as PeopleIcon,
  RecordVoiceOver as RecordVoiceOverIcon,
  Translate as TranslateIcon,
  ReportGmailerrorred as ReportGmailerrorredIcon,
  Visibility as VisibilityIcon,
  PhotoCamera as PhotoCameraIcon,
  Check as CheckIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import KeyIcon from '@mui/icons-material/Key';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setUser, logout } from '@/store/authStore';
import {
  ME_QUERY,
  USER_BY_USERNAME_QUERY,
  FRIENDS_QUERY,
  PENDING_FRIEND_REQUESTS_QUERY,
  SENT_FRIEND_REQUESTS_QUERY,
} from '@/api/queries';
import {
  UPDATE_ME_MUTATION,
  SEND_FRIEND_REQUEST_MUTATION,
  RESPOND_FRIEND_REQUEST_MUTATION,
  REMOVE_FRIEND_MUTATION,
  RESET_PASSWORD_MUTATION,
  DELETE_ACCOUNT_MUTATION,
} from '@/api/mutations';
import apolloClient from '@/lib/apolloClient';
import {
  getSupabaseStorageUrl,
  uploadImage,
  deleteImage,
} from '@/utils/supabaseStorage';
import { clearSupabaseClientCache } from '@/lib/supabaseClient';
import { clearSupabaseStorageCache } from '@/utils/supabaseStorage';
import {
  LANGUAGES,
  LANGUAGE_LEVELS,
  getLanguageCode,
  languageToCountryCode,
} from '@/utils/languages';
import type { User, Language } from '@/types';
import FlagIcon from '@/components/FlagIcon';
import imageCompression from 'browser-image-compression';
import { Cropper } from 'react-advanced-cropper';
import type { CropperRef } from 'react-advanced-cropper';
import 'react-advanced-cropper/dist/style.css';

interface LanguageInput {
  name: string;
  level: string;
  code: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`friends-tabpanel-${index}`}
      aria-labelledby={`friends-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ProfilePage = () => {
  // const navigate = useNavigate();
  const { username } = useParams<{ username?: string }>();
  const dispatch = useAppDispatch();
  const { user: currentUser, accessToken } = useAppSelector(
    (state) => state.auth,
  );

  const isOwnProfile = !username || username === currentUser?.username;
  const profileUsername = username || currentUser?.username;

  const [avatarUrlSigned, setAvatarUrlSigned] = useState<string>('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profileAvatarLoaded, setProfileAvatarLoaded] = useState(false);
  const [friendsTabValue, setFriendsTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarMenuAnchor, setAvatarMenuAnchor] = useState<null | HTMLElement>(
    null,
  );
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const cropperRef = useRef<CropperRef>(null);
  const [avatarViewDialogOpen, setAvatarViewDialogOpen] = useState(false);

  // Queries
  const {
    data: meData,
    loading: meLoading,
    error: meError,
    refetch: refetchMe,
  } = useQuery(ME_QUERY, {
    skip: !isOwnProfile || !currentUser,
    fetchPolicy: 'network-only',
  });

  const {
    data: userData,
    loading: userLoading,
    error: userError,
    refetch: refetchUser,
  } = useQuery(USER_BY_USERNAME_QUERY, {
    variables: { username: profileUsername! },
    skip: isOwnProfile || !profileUsername,
    fetchPolicy: 'network-only',
  });

  const { data: friendsData, refetch: refetchFriends } = useQuery(
    FRIENDS_QUERY,
    {
      skip: !currentUser,
      fetchPolicy: 'cache-first',
    },
  );

  const { data: pendingRequestsData, refetch: refetchPendingRequests } =
    useQuery(PENDING_FRIEND_REQUESTS_QUERY, {
      skip: !currentUser,
      fetchPolicy: 'cache-first',
    });

  const { data: sentRequestsData, refetch: refetchSentRequests } = useQuery(
    SENT_FRIEND_REQUESTS_QUERY,
    {
      skip: !currentUser || isOwnProfile,
      fetchPolicy: 'cache-first',
    },
  );

  // Mutations
  const [updateMe, { loading: updating }] = useMutation(UPDATE_ME_MUTATION);
  const [sendFriendRequest] = useMutation(SEND_FRIEND_REQUEST_MUTATION);
  const [respondFriendRequest] = useMutation(RESPOND_FRIEND_REQUEST_MUTATION);
  const [removeFriend] = useMutation(REMOVE_FRIEND_MUTATION);
  const [resetPassword] = useMutation(RESET_PASSWORD_MUTATION);

  const loading = isOwnProfile ? meLoading : userLoading;
  const error = isOwnProfile ? meError : userError;

  // Check friend status
  const friends = friendsData?.friends || [];
  const profile = isOwnProfile ? meData?.me : userData?.userByUsername;
  const profileUserId = profile?.id;
  const isFriend = friends.some((f: User) => f.id === profileUserId);
  const sentRequests = sentRequestsData?.sentFriendRequests || [];
  const hasPendingRequest = sentRequests.some(
    (req: any) => req.receiver?.id === profileUserId,
  );
  const pendingRequests = pendingRequestsData?.pendingFriendRequests || [];
  const hasReceivedRequest =
    !isOwnProfile &&
    pendingRequests.some((req: any) => req.sender?.id === profileUserId);
  const receivedRequestFromProfile = !isOwnProfile
    ? pendingRequests.find((req: any) => req.sender?.id === profileUserId)
    : null;

  // Fetch and set avatar URL
  useEffect(() => {
    const fetchAvatar = async () => {
      if (profile?.avatarUrl && accessToken) {
        try {
          const url = await getSupabaseStorageUrl(
            profile.avatarUrl,
            'avatars',
            accessToken,
          );
          // Only set URL if it's valid (empty string means file not found)
          setAvatarUrlSigned(url || '');
          // Reset loaded state when URL changes
          setProfileAvatarLoaded(false);
        } catch (error) {
          console.error('Failed to get avatar URL:', error);
          setAvatarUrlSigned('');
          setProfileAvatarLoaded(false);
        }
      } else {
        setAvatarUrlSigned('');
        setProfileAvatarLoaded(false);
      }
    };

    if (profile) {
      fetchAvatar();
    } else {
      // Clear avatar if no profile
      setAvatarUrlSigned('');
      setProfileAvatarLoaded(false);
    }
  }, [profile?.avatarUrl, profile?.id, accessToken]);

  // Reset loaded state when avatar URL changes
  useEffect(() => {
    setProfileAvatarLoaded(false);
  }, [avatarUrlSigned]);

  const showSnackbar = (
    message: string,
    severity: 'success' | 'error' | 'warning' | 'info' = 'success',
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => {
    if (isOwnProfile) {
      setAvatarMenuAnchor(event.currentTarget);
    } else if (avatarUrlSigned) {
      // For other users, open the image view dialog
      setAvatarViewDialogOpen(true);
    }
  };

  const handleAvatarMenuClose = () => {
    setAvatarMenuAnchor(null);
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showSnackbar('Please select an image file', 'error');
      return;
    }

    // Create object URL for the cropper
    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
    setCropperOpen(true);
  };

  const handleCropCancel = () => {
    setCropperOpen(false);
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage);
      setSelectedImage(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropConfirm = async () => {
    if (!cropperRef.current || !currentUser || !accessToken || !selectedImage) {
      return;
    }

    try {
      // Get cropped canvas
      const canvas = cropperRef.current.getCanvas();
      if (!canvas) {
        showSnackbar('Failed to crop image', 'error');
        return;
      }

      // Convert canvas to blob
      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            showSnackbar('Failed to process cropped image', 'error');
            return;
          }

          // Convert blob to File
          const croppedFile = new File([blob], 'avatar.jpg', {
            type: 'image/jpeg',
          });

          // Close cropper
          setCropperOpen(false);
          URL.revokeObjectURL(selectedImage);
          setSelectedImage(null);

          // Upload the cropped image
          await handleAvatarUpload(croppedFile);
        },
        'image/jpeg',
        0.9,
      );
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to crop image', 'error');
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!currentUser || !accessToken) return;

    setUploadingAvatar(true);
    try {
      // Compress image
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: file.type,
      };

      let compressedFile: File;
      try {
        compressedFile = await imageCompression(file, options);
      } catch (compressError) {
        console.error('Image compression failed:', compressError);
        compressedFile = file;
      }

      // Delete old avatar if exists
      const currentAvatarUrl = profile?.avatarUrl;
      if (currentAvatarUrl) {
        try {
          await deleteImage(currentAvatarUrl, 'avatars', accessToken);
        } catch (deleteError) {
          console.warn('Failed to delete old avatar:', deleteError);
        }
      }

      // Upload new avatar
      const filePath = await uploadImage(
        compressedFile,
        'avatars',
        'profile',
        currentUser.id,
        accessToken,
      );

      // Update profile
      const { data } = await updateMe({
        variables: {
          data: {
            avatarUrl: filePath,
          },
        },
      });

      if (data?.updateMe) {
        dispatch(setUser(data.updateMe));
        // Get signed URL for new avatar
        const signedUrl = await getSupabaseStorageUrl(
          filePath,
          'avatars',
          accessToken,
        );
        setAvatarUrlSigned(signedUrl);
        showSnackbar('Avatar updated successfully!', 'success');
        refetchMe();
      }
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to upload avatar', 'error');
    } finally {
      setUploadingAvatar(false);
      handleAvatarMenuClose();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFriendAction = async () => {
    if (!profileUserId || !currentUser) return;

    try {
      if (isFriend) {
        await removeFriend({
          variables: { friendId: profileUserId },
        });
        showSnackbar('Friend removed', 'success');
        refetchFriends();
      } else {
        await sendFriendRequest({
          variables: { receiverId: profileUserId },
        });
        showSnackbar('Friend request sent', 'success');
        refetchSentRequests();
      }
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to update friend status', 'error');
    }
  };

  // Show loading spinner while loading or when profile is not yet available
  if (loading || (!profile && !error)) {
    return (
      <Container
        maxWidth="lg"
        sx={{
          mt: 4,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress size={60} />
      </Container>
    );
  }

  // Show error message if query failed or profile not found after loading
  if (error || !profile) {
    return (
      <Container
        maxWidth="lg"
        sx={{
          mt: 4,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="h1"
            component="div"
            sx={{ fontSize: '6rem', lineHeight: 1, mb: 2 }}
          >
            .
          </Typography>
          <Alert severity="error" sx={{ mt: 2 }}>
            {error
              ? error.message || 'Failed to load profile'
              : 'Profile not found'}
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container
      maxWidth="md"
      sx={{
        mt: { xs: 2, sm: 3, md: 4 },
        mb: { xs: 2, sm: 3, md: 4 },
        px: { xs: 1, sm: 2, md: 3 },
      }}
    >
      <ProfileHeader
        profile={profile}
        isOwnProfile={isOwnProfile}
        avatarUrlSigned={avatarUrlSigned}
        uploadingAvatar={uploadingAvatar}
        avatarMenuAnchor={avatarMenuAnchor}
        profileAvatarLoaded={profileAvatarLoaded}
        onAvatarLoad={() => setProfileAvatarLoaded(true)}
        onAvatarClick={handleAvatarClick}
        onAvatarMenuClose={handleAvatarMenuClose}
        onFileSelect={handleFileSelect}
        fileInputRef={fileInputRef}
        isFriend={isFriend}
        hasPendingRequest={hasPendingRequest}
        hasReceivedRequest={hasReceivedRequest}
        receivedRequestFromProfile={receivedRequestFromProfile}
        onFriendAction={handleFriendAction}
        onRespondRequest={async (requestId: string, accept: boolean) => {
          try {
            await respondFriendRequest({
              variables: { requestId, accept },
            });
            showSnackbar(
              accept ? 'Friend request accepted' : 'Friend request rejected',
              'success',
            );
            refetchPendingRequests();
            refetchFriends();
            if (!isOwnProfile) {
              refetchUser();
            }
          } catch (error: any) {
            showSnackbar(
              error.message || 'Failed to respond to request',
              'error',
            );
          }
        }}
        onViewImage={() => setAvatarViewDialogOpen(true)}
      />

      {isOwnProfile ? (
        <ProfileEditForm
          profile={profile}
          accessToken={accessToken}
          friends={friends}
          pendingRequests={pendingRequestsData?.pendingFriendRequests || []}
          sentRequests={sentRequests}
          friendsTabValue={friendsTabValue}
          onTabChange={setFriendsTabValue}
          onRespondRequest={async (requestId: string, accept: boolean) => {
            try {
              await respondFriendRequest({
                variables: { requestId, accept },
              });
              showSnackbar(
                accept ? 'Friend request accepted' : 'Friend request rejected',
                'success',
              );
              refetchPendingRequests();
              refetchFriends();
            } catch (error: any) {
              showSnackbar(
                error.message || 'Failed to respond to request',
                'error',
              );
            }
          }}
          onUpdate={(updatedUser) => {
            dispatch(setUser(updatedUser));
            refetchMe();
            showSnackbar('Profile updated successfully!', 'success');
          }}
          onError={(error) => showSnackbar(error, 'error')}
          onSuccess={(message) => showSnackbar(message, 'info')}
        />
      ) : (
        <ProfileView profile={profile} />
      )}

      {/* Avatar View Dialog */}
      <Dialog
        open={avatarViewDialogOpen}
        onClose={() => setAvatarViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            maxWidth: 'fit-content',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6">Profile Picture</Typography>
          <IconButton
            onClick={() => setAvatarViewDialogOpen(false)}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{
            p: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
          }}
        >
          {avatarUrlSigned && (
            <Box
              component="img"
              src={avatarUrlSigned}
              alt={profile.username || profile.email || 'Profile picture'}
              sx={{
                maxWidth: '100%',
                maxHeight: '70vh',
                objectFit: 'contain',
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Avatar Cropper Dialog */}
      <Dialog
        open={cropperOpen}
        onClose={handleCropCancel}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
          },
        }}
      >
        <DialogTitle>Crop Avatar Image</DialogTitle>
        <DialogContent
          sx={{
            overflow: 'hidden',
            p: 2,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {selectedImage && (
            <Box
              sx={{
                width: '100%',
                maxWidth: '100%',
                maxHeight: '70vh',
                minHeight: '400px',
                height: '70vh',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                '& .react-advanced-cropper': {
                  height: '100%',
                  width: '100%',
                  maxWidth: '100%',
                  maxHeight: '100%',
                },
                '& .react-advanced-cropper__area': {
                  maxWidth: '100%',
                  maxHeight: '100%',
                },
                '& .react-advanced-cropper__image': {
                  maxWidth: '100%',
                  maxHeight: '100%',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                },
              }}
            >
              <Cropper
                ref={cropperRef}
                src={selectedImage}
                stencilProps={{
                  aspectRatio: 1, // Square ratio
                  movable: true,
                  resizable: true,
                }}
                className="cropper"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCropCancel} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleCropConfirm}
            variant="contained"
            color="primary"
            disabled={uploadingAvatar}
          >
            {uploadingAvatar ? 'Uploading...' : 'Crop & Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%', color: 'white' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

// Profile Header Component
interface ProfileHeaderProps {
  profile: User;
  isOwnProfile: boolean;
  avatarUrlSigned: string;
  uploadingAvatar: boolean;
  avatarMenuAnchor: HTMLElement | null;
  profileAvatarLoaded: boolean;
  onAvatarLoad: () => void;
  onAvatarClick: (event: React.MouseEvent<HTMLElement>) => void;
  onAvatarMenuClose: () => void;
  onFileSelect: (file: File) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isFriend: boolean;
  hasPendingRequest: boolean;
  hasReceivedRequest?: boolean;
  receivedRequestFromProfile?: any;
  onFriendAction: () => void;
  onRespondRequest?: (requestId: string, accept: boolean) => Promise<void>;
  onViewImage: () => void;
}

const ProfileHeader = ({
  profile,
  isOwnProfile,
  avatarUrlSigned,
  uploadingAvatar,
  avatarMenuAnchor,
  profileAvatarLoaded,
  onAvatarLoad,
  onAvatarClick,
  onAvatarMenuClose,
  onFileSelect,
  fileInputRef,
  isFriend,
  hasPendingRequest,
  hasReceivedRequest = false,
  receivedRequestFromProfile,
  onFriendAction,
  onRespondRequest,
  onViewImage,
}: ProfileHeaderProps) => {
  return (
    <Paper
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        mb: { xs: 2, sm: 3, md: 4 },
        textAlign: 'center',
      }}
    >
      <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
        <IconButton
          onClick={onAvatarClick}
          disabled={uploadingAvatar}
          sx={{
            width: { xs: 80, sm: 120, md: 150, lg: 180 },
            height: { xs: 80, sm: 120, md: 150, lg: 180 },
            border: '4px solid',
            borderColor: 'divider',
            cursor: !isOwnProfile && avatarUrlSigned ? 'pointer' : 'default',
          }}
        >
          {uploadingAvatar ? (
            <CircularProgress />
          ) : avatarUrlSigned ? (
            <Avatar
              src={avatarUrlSigned}
              alt={profile.username || profile.email}
              sx={{
                width: '100%',
                height: '100%',
                fontSize: { xs: '2rem', sm: '3rem', md: '4rem', lg: '5rem' },
                opacity: !profileAvatarLoaded ? 0 : 1,
                transition: 'opacity 0.3s ease-in-out',
              }}
              imgProps={{
                onLoad: onAvatarLoad,
              }}
            />
          ) : (
            <Avatar
              sx={{
                width: '100%',
                height: '100%',
                fontSize: { xs: '3rem', sm: '4rem', md: '5rem' },
                bgcolor: 'primary.main',
              }}
            >
              {(profile.username || profile.email || 'U')
                .charAt(0)
                .toUpperCase()}
            </Avatar>
          )}
        </IconButton>
        {isOwnProfile && (
          <Menu
            anchorEl={avatarMenuAnchor}
            open={Boolean(avatarMenuAnchor)}
            onClose={onAvatarMenuClose}
          >
            {avatarUrlSigned && (
              <MenuItem
                onClick={() => {
                  onViewImage();
                  onAvatarMenuClose();
                }}
              >
                <ListItemIcon>
                  <VisibilityIcon fontSize="small" />
                </ListItemIcon>
                View Image
              </MenuItem>
            )}
            <MenuItem
              onClick={() => {
                fileInputRef.current?.click();
                onAvatarMenuClose();
              }}
            >
              <ListItemIcon>
                <PhotoCameraIcon fontSize="small" />
              </ListItemIcon>
              Change Image
            </MenuItem>
          </Menu>
        )}
      </Box>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onFileSelect(file);
          }
        }}
      />

      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}
      >
        {isOwnProfile ? 'Account' : profile.username || 'Profile'}
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        gutterBottom
        sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
      >
        {isOwnProfile
          ? 'Update your personal information'
          : profile.bio || 'User profile'}
      </Typography>

      {!isOwnProfile && (
        <Box
          sx={{
            mt: { xs: 1, sm: 2 },
            display: 'flex',
            gap: { xs: 1, sm: 2 },
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {hasReceivedRequest && receivedRequestFromProfile ? (
            <>
              <Button
                variant="contained"
                startIcon={<CheckIcon />}
                onClick={() =>
                  onRespondRequest?.(receivedRequestFromProfile.id, true)
                }
              >
                Accept
              </Button>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={() =>
                  onRespondRequest?.(receivedRequestFromProfile.id, false)
                }
              >
                Reject
              </Button>
            </>
          ) : hasPendingRequest ? (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<PersonAddIcon />}
              disabled
            >
              Pending Request
            </Button>
          ) : isFriend ? (
            <Button
              variant="outlined"
              color="error"
              startIcon={<PersonRemoveIcon />}
              onClick={onFriendAction}
            >
              Remove Friend
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={onFriendAction}
            >
              Add Friend
            </Button>
          )}
          {isFriend && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<ChatIcon />}
              onClick={() => {
                // TODO: Implement chat
                alert('Chat feature coming soon');
              }}
            >
              Start Chat
            </Button>
          )}
        </Box>
      )}
    </Paper>
  );
};

// Profile Edit Form Component
interface ProfileEditFormProps {
  profile: User;
  accessToken: string | null;
  friends: User[];
  pendingRequests: any[];
  sentRequests: any[];
  friendsTabValue: number;
  onTabChange: (value: number) => void;
  onRespondRequest: (requestId: string, accept: boolean) => Promise<void>;
  onUpdate: (user: User) => void;
  onError: (error: string) => void;
  onSuccess?: (message: string) => void;
}

const ProfileEditForm = ({
  profile,
  accessToken,
  friends,
  pendingRequests,
  sentRequests,
  friendsTabValue,
  onTabChange,
  onRespondRequest,
  onUpdate,
  onError,
  onSuccess,
}: ProfileEditFormProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [updateMe, { loading }] = useMutation(UPDATE_ME_MUTATION);
  const [resetPasswordMutation] = useMutation(RESET_PASSWORD_MUTATION);
  const [deleteAccountMutation] = useMutation(DELETE_ACCOUNT_MUTATION);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  const validationSchema = Yup.object({
    name: Yup.string().required('Name is required'),
    username: Yup.string()
      .min(3, 'Username must be at least 3 characters')
      .matches(
        /^[a-zA-Z0-9_]+$/,
        'Username can only contain letters, numbers, and underscores',
      )
      .required('Username is required'),
    bio: Yup.string()
      .max(500, 'Bio must be less than 500 characters')
      .required('Bio is required'),
    country: Yup.string().required('Country is required'),
    age: Yup.string()
      .required('Age is required')
      .test('is-positive-number', 'Age must be a positive number', (value) => {
        if (!value) return false;
        const num = Number(value);
        return !isNaN(num) && num > 0;
      })
      .test('min-age', 'Age must be larger than 16', (value) => {
        if (!value) return false;
        const num = Number(value);
        return !isNaN(num) && num > 16;
      })
      .test('max-age', 'Age must be 99 or less', (value) => {
        if (!value) return false;
        const num = Number(value);
        return !isNaN(num) && num <= 99;
      }),
  });

  const initialValues = {
    name: profile.name || '',
    username: profile.username || '',
    bio: profile.bio || '',
    country: profile.country || '',
    age: profile.age?.toString() || '',
    languagesKnown: (profile.languagesKnown || []).map((lang) => ({
      name: lang.name,
      level: lang.level,
      code: lang.code,
    })),
    languagesLearn: (profile.languagesLearn || []).map((lang) => ({
      name: lang.name,
      level: lang.level,
      code: lang.code,
    })),
  };

  const handleSubmit = async (values: any) => {
    try {
      // Validation checks
      const incompleteKnown = values.languagesKnown.some(
        (lang: LanguageInput) =>
          (lang.name.trim() !== '' && lang.level.trim() === '') ||
          (lang.name.trim() === '' && lang.level.trim() !== ''),
      );
      const incompleteLearn = values.languagesLearn.some(
        (lang: LanguageInput) =>
          (lang.name.trim() !== '' && lang.level.trim() === '') ||
          (lang.name.trim() === '' && lang.level.trim() !== ''),
      );

      if (incompleteKnown || incompleteLearn) {
        onError('Please complete all language entries');
        return;
      }

      // Check duplicates
      const knownLanguages = values.languagesKnown
        .map((lang: LanguageInput) => lang.name.trim())
        .filter((name: string) => name !== '');
      const knownDuplicates =
        new Set(knownLanguages).size !== knownLanguages.length;

      const learnLanguages = values.languagesLearn
        .map((lang: LanguageInput) => lang.name.trim())
        .filter((name: string) => name !== '');
      const learnDuplicates =
        new Set(learnLanguages).size !== learnLanguages.length;

      if (knownDuplicates || learnDuplicates) {
        onError('You cannot add the same language more than once in each list');
        return;
      }

      // Clean languages
      const cleanLanguages = (langs: LanguageInput[]) =>
        langs
          .filter((lang) => lang.name.trim() !== '' && lang.level.trim() !== '')
          .map(({ name, level, code }) => ({ name, level, code }));

      const cleanedLanguagesKnown = cleanLanguages(values.languagesKnown);
      const cleanedLanguagesLearn = cleanLanguages(values.languagesLearn);

      if (cleanedLanguagesKnown.length < 1) {
        onError('At least one known language required');
        return;
      }

      if (cleanedLanguagesLearn.length < 1) {
        onError('At least one learning language required');
        return;
      }

      // Check for native language
      const nativeLanguages = cleanedLanguagesKnown.filter(
        (lang) => lang.level === 'Native',
      );
      if (nativeLanguages.length < 1) {
        onError('You must have at least one native language');
        return;
      }

      // Check conflicts
      const nativeFluentKnown = values.languagesKnown
        .filter(
          (lang: LanguageInput) =>
            lang.name.trim() !== '' &&
            (lang.level === 'Native' || lang.level === 'Fluent'),
        )
        .map((lang: LanguageInput) => lang.name);
      const conflictingLearn = values.languagesLearn.some(
        (lang: LanguageInput) =>
          lang.name.trim() !== '' && nativeFluentKnown.includes(lang.name),
      );

      if (conflictingLearn) {
        onError(
          'You cannot learn a language that you already know at Native or Fluent level',
        );
        return;
      }

      const { data } = await updateMe({
        variables: {
          data: {
            name: values.name || null,
            username: values.username || null,
            bio: values.bio || null,
            country: values.country || null,
            age: values.age ? Number(values.age) : null,
            languagesKnown:
              cleanedLanguagesKnown.length > 0 ? cleanedLanguagesKnown : null,
            languagesLearn:
              cleanedLanguagesLearn.length > 0 ? cleanedLanguagesLearn : null,
          },
        },
      });

      if (data?.updateMe) {
        onUpdate(data.updateMe);
      }
    } catch (error: any) {
      onError(error.message || 'Failed to update profile');
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      enableReinitialize
    >
      {({ values, errors, touched, setFieldValue, isSubmitting }) => (
        <Form>
          <Paper sx={{ p: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <InfoOutlineIcon color="primary" />
              <Typography variant="h5">Basic Information</Typography>
            </Box>
            <Box
              sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}
            >
              <Box sx={{ position: 'relative' }}>
                <Field
                  as={TextField}
                  name="name"
                  label="Name"
                  placeholder="Your full name (Only visible to you)"
                  fullWidth
                  error={touched.name && !!errors.name}
                  helperText={touched.name && errors.name}
                />
                <EditIcon
                  sx={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 18,
                    color: 'action.active',
                    pointerEvents: 'none',
                  }}
                />
              </Box>

              <Box sx={{ position: 'relative' }}>
                <Field
                  as={TextField}
                  name="username"
                  label="Username"
                  placeholder="Set a unique username"
                  fullWidth
                  error={touched.username && !!errors.username}
                  helperText={touched.username && errors.username}
                />
                <EditIcon
                  sx={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 18,
                    color: 'action.active',
                    pointerEvents: 'none',
                  }}
                />
              </Box>

              <Box sx={{ position: 'relative' }}>
                <Field
                  as={TextField}
                  name="bio"
                  label="Bio"
                  placeholder="Tell us about yourself..."
                  fullWidth
                  multiline
                  rows={4}
                  error={touched.bio && !!errors.bio}
                  helperText={touched.bio && errors.bio}
                />
                <EditIcon
                  sx={{
                    position: 'absolute',
                    right: 12,
                    top: 24,
                    fontSize: 18,
                    color: 'action.active',
                    pointerEvents: 'none',
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl
                  fullWidth
                  error={touched.country && !!errors.country}
                >
                  <InputLabel>Country</InputLabel>
                  <Field
                    as={Select}
                    name="country"
                    label="Country"
                    input={<OutlinedInput label="Country" />}
                  >
                    {[
                      'TR',
                      'DE',
                      'US',
                      'GB',
                      'CA',
                      'FR',
                      'ES',
                      'PT',
                      'IT',
                      'NL',
                      'BE',
                      'SE',
                      'NO',
                      'DK',
                      'FI',
                      'PL',
                      'CZ',
                      'SK',
                      'SI',
                      'RO',
                      'HU',
                      'GR',
                      'UA',
                      'RU',
                      'IN',
                      'JP',
                      'CN',
                      'KR',
                      'BR',
                      'AR',
                      'MX',
                      'AU',
                      'NZ',
                      'IE',
                      'IL',
                      'SA',
                      'AE',
                      'ZA',
                      'EG',
                      'PK',
                      'BD',
                      'VN',
                      'TH',
                      'ID',
                      'MY',
                      'PH',
                    ].map((code) => (
                      <MenuItem key={code} value={code}>
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <FlagIcon countryCode={code} size={16} />
                          <Typography>
                            {typeof window !== 'undefined'
                              ? new Intl.DisplayNames(['en'], {
                                  type: 'region',
                                }).of(code)
                              : code}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Field>
                </FormControl>

                <Box sx={{ position: 'relative', width: 200 }}>
                  <Field name="age">
                    {({ field, meta }: any) => (
                      <TextField
                        {...field}
                        label="Age"
                        type="text"
                        fullWidth
                        error={meta.touched && !!meta.error}
                        helperText={meta.touched && meta.error}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const value = e.target.value;
                          // Only allow digits
                          if (value === '' || /^\d+$/.test(value)) {
                            setFieldValue('age', value);
                          }
                        }}
                      />
                    )}
                  </Field>
                  <EditIcon
                    sx={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: 18,
                      color: 'action.active',
                      pointerEvents: 'none',
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* Friends Section */}
          <FriendsSection
            isOwnProfile={true}
            friends={friends}
            pendingRequests={pendingRequests}
            sentRequests={sentRequests}
            friendsTabValue={friendsTabValue}
            onTabChange={onTabChange}
            onRespondRequest={onRespondRequest}
            accessToken={accessToken}
          />

          <LanguageSection
            title="Languages I Know"
            languages={values.languagesKnown}
            onAdd={() => {
              setFieldValue('languagesKnown', [
                ...values.languagesKnown,
                { name: '', level: '', code: '' },
              ]);
            }}
            onRemove={(index) => {
              const updated = values.languagesKnown.filter(
                (_: any, i: number) => i !== index,
              );
              setFieldValue('languagesKnown', updated);
            }}
            onUpdate={(index, key, value) => {
              const updated = [...values.languagesKnown];
              updated[index] = { ...updated[index], [key]: value };
              if (key === 'name') {
                updated[index].code = getLanguageCode(value);
              }
              setFieldValue('languagesKnown', updated);
            }}
            excludedLanguages={[]}
            allowNative={true}
          />

          <LanguageSection
            title="Languages I'm Learning"
            languages={values.languagesLearn}
            onAdd={() => {
              setFieldValue('languagesLearn', [
                ...values.languagesLearn,
                { name: '', level: '', code: '' },
              ]);
            }}
            onRemove={(index) => {
              const updated = values.languagesLearn.filter(
                (_: any, i: number) => i !== index,
              );
              setFieldValue('languagesLearn', updated);
            }}
            onUpdate={(index, key, value) => {
              const updated = [...values.languagesLearn];
              updated[index] = { ...updated[index], [key]: value };
              if (key === 'name') {
                updated[index].code = getLanguageCode(value);
              }
              setFieldValue('languagesLearn', updated);
            }}
            excludedLanguages={values.languagesKnown
              .filter(
                (lang) =>
                  lang.name.trim() !== '' &&
                  (lang.level === 'Native' || lang.level === 'Fluent'),
              )
              .map((lang) => lang.name)}
            allowNative={false}
          />

          {/* Password Reset Section */}
          <Paper sx={{ p: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <KeyIcon color="primary" />
              <Typography variant="h5">Password Reset</Typography>
            </Box>
            <Box
              sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}
            >
              <Typography variant="body2" color="text.secondary">
                Click the button below to receive a password reset email.
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                onClick={async () => {
                  try {
                    await resetPasswordMutation({
                      variables: {
                        email: profile.email,
                      },
                    });

                    if (onSuccess) {
                      onSuccess('Password reset email sent.');
                    }
                  } catch (error: any) {
                    onError(
                      error.message || 'Failed to send password reset email',
                    );
                  }
                }}
              >
                Send Password Reset Email
              </Button>
            </Box>
          </Paper>

          {/* Danger Zone Section */}
          {profile.role !== 'ADMIN' && profile.role !== 'MODERATOR' && (
            <Paper
              sx={{
                p: 4,
                mb: 4,
                border: '2px solid',
                borderColor: 'error.main',
              }}
            >
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
              >
                <ReportGmailerrorredIcon sx={{ color: 'error.main' }} />
                <Typography
                  variant="h5"
                  sx={{ color: 'error.main', fontWeight: 'bold' }}
                >
                  Danger Zone
                </Typography>
              </Box>
              <Box
                sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    border: '1px solid',
                    borderColor: 'error.main',
                    borderRadius: 1,
                    bgcolor: 'rgba(211, 47, 47, 0.04)',
                  }}
                >
                  <Box>
                    <Typography
                      variant="body1"
                      fontWeight="medium"
                      color="error"
                    >
                      Delete Account
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Once you delete your account, there is no going back.
                      Please be certain.
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    Delete Account
                  </Button>
                </Box>
              </Box>
            </Paper>
          )}

          {/* Save Changes Button - Full Width */}
          <Box sx={{ mb: 4 }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isSubmitting || loading}
            >
              {isSubmitting || loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>

          {/* Delete Account Confirmation Dialog */}
          <Dialog
            open={deleteDialogOpen}
            onClose={() => {
              setDeleteDialogOpen(false);
              setDeletePassword('');
            }}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle sx={{ color: 'error.main', fontWeight: 'bold' }}>
              Delete Account
            </DialogTitle>
            <DialogContent>
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="medium">
                  Warning: This action cannot be undone!
                </Typography>
                <Typography variant="body2">
                  All your data, including posts, comments, messages, and
                  friends, will be permanently deleted.
                </Typography>
              </Alert>
              <Typography variant="body2" sx={{ mb: 2 }}>
                To confirm, please enter your password:
              </Typography>
              <TextField
                type="password"
                label="Password"
                fullWidth
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                variant="outlined"
                autoFocus
              />
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setDeletePassword('');
                }}
                color="inherit"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!deletePassword) {
                    onError('Please enter your password');
                    return;
                  }

                  setDeletingAccount(true);
                  try {
                    const { data } = await deleteAccountMutation({
                      variables: { password: deletePassword },
                    });

                    if (data?.deleteAccount) {
                      // Clear all caches and state
                      await apolloClient.clearStore();
                      clearSupabaseClientCache();
                      clearSupabaseStorageCache();
                      dispatch(logout());

                      // Show success message briefly before redirect
                      if (onSuccess) {
                        onSuccess('Account deleted successfully');
                      }

                      // Redirect to home/login after a short delay
                      setTimeout(() => {
                        navigate('/');
                      }, 1500);
                    }
                  } catch (error: any) {
                    onError(error.message || 'Failed to delete account');
                    setDeletePassword('');
                  } finally {
                    setDeletingAccount(false);
                  }
                }}
                variant="contained"
                color="error"
                disabled={deletingAccount || !deletePassword}
              >
                {deletingAccount ? 'Deleting...' : 'Delete Account'}
              </Button>
            </DialogActions>
          </Dialog>
        </Form>
      )}
    </Formik>
  );
};

// Language Section Component
interface LanguageSectionProps {
  title: string;
  languages: LanguageInput[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, key: keyof LanguageInput, value: string) => void;
  excludedLanguages: string[];
  allowNative: boolean;
}

const LanguageSection = ({
  title,
  languages,
  onAdd,
  onRemove,
  onUpdate,
  excludedLanguages,
  allowNative,
}: LanguageSectionProps) => {
  const getAvailableLanguages = (currentIndex: number) => {
    const selectedLanguages = languages
      .map((lang, idx) => (idx !== currentIndex ? lang.name : ''))
      .filter((name) => name.trim() !== '');
    return LANGUAGES.filter(
      (lang) =>
        !selectedLanguages.includes(lang.name) &&
        !excludedLanguages.includes(lang.name),
    );
  };

  return (
    <Paper sx={{ p: 4, mb: 4 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 2 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {title === 'Languages I Know' ? (
            <RecordVoiceOverIcon color="primary" />
          ) : (
            <TranslateIcon color="primary" />
          )}
          <Typography
            variant="h5"
            fontSize={{
              xs: '1rem',
              sm: '1.2rem',
              md: '1.5rem',
              lg: '2rem',
            }}
          >
            {title}
          </Typography>
        </Box>
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 1.5, sm: 2 },
        }}
      >
        {languages.map((lang, index) => (
          <Box
            key={lang.code}
            sx={{
              display: 'flex',
              gap: { xs: 0.5, sm: 1, md: 2 },
              alignItems: 'center',
              flexWrap: 'nowrap',
            }}
          >
            <FormControl
              size="small"
              sx={{
                flex: 1,
                minWidth: { xs: 100, sm: 150 },
                '& .MuiInputLabel-root': {
                  fontSize: { xs: '0.875rem', sm: '0.875rem', md: '1rem' },
                },
                '& .MuiSelect-select': {
                  fontSize: { xs: '0.875rem', sm: '0.875rem', md: '1rem' },
                  display: 'flex',
                  alignItems: 'center',
                },
              }}
            >
              <InputLabel size="small">Language</InputLabel>
              <Select
                size="small"
                value={lang.name}
                onChange={(e) => onUpdate(index, 'name', e.target.value)}
                input={<OutlinedInput label="Language" />}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: { xs: 300, sm: 400 },
                      '& .MuiMenuItem-root': {
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        py: { xs: 0.5, sm: 1 },
                      },
                    },
                  },
                }}
              >
                {getAvailableLanguages(index).map((language) => (
                  <MenuItem key={language.code} value={language.name}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: { xs: 0.5, sm: 1 },
                      }}
                    >
                      <FlagIcon
                        countryCode={languageToCountryCode(language.code)}
                        size={14}
                      />
                      <Typography
                        sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                      >
                        {language.name}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl
              size="small"
              sx={{
                width: { xs: 100, sm: 130, md: 160 },
                flexShrink: 0,
                '& .MuiInputLabel-root': {
                  fontSize: { xs: '0.875rem', sm: '0.875rem', md: '1rem' },
                },
                '& .MuiSelect-select': {
                  fontSize: { xs: '0.875rem', sm: '0.875rem', md: '1rem' },
                  display: 'flex',
                  alignItems: 'center',
                },
              }}
            >
              <InputLabel size="small">Level</InputLabel>
              <Select
                size="small"
                value={lang.level}
                onChange={(e) => onUpdate(index, 'level', e.target.value)}
                input={<OutlinedInput label="Level" />}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: { xs: 300, sm: 400 },
                      '& .MuiMenuItem-root': {
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        py: { xs: 0.5, sm: 1 },
                      },
                    },
                  },
                }}
              >
                {LANGUAGE_LEVELS.filter(
                  (level) => allowNative || level.value !== 'Native',
                ).map((level) => (
                  <MenuItem key={level.value} value={level.value}>
                    <Typography
                      sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                    >
                      {level.label}
                    </Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <IconButton
              color="error"
              onClick={() => onRemove(index)}
              disabled={languages.length === 1}
              size="small"
              sx={{
                flexShrink: 0,
                width: { xs: 16, sm: 36, md: 40 },
                height: { xs: 16, sm: 36, md: 40 },
                minWidth: { xs: 16, sm: 36, md: 40 },
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={onAdd}
        >
          Add Language
        </Button>
      </Box>
    </Paper>
  );
};

// Profile View Component (read-only)
interface ProfileViewProps {
  profile: User;
}

const ProfileView = ({ profile }: ProfileViewProps) => {
  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Basic Information
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Username
          </Typography>
          <Typography variant="body1">
            {profile.username || 'Not provided'}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Bio
          </Typography>
          <Typography variant="body1">
            {profile.bio || 'No bio provided'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Country
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {profile.country && (
                <FlagIcon countryCode={profile.country} size={18} />
              )}
              <Typography variant="body1">
                {profile.country
                  ? typeof window !== 'undefined'
                    ? new Intl.DisplayNames(['en'], { type: 'region' }).of(
                        profile.country.toUpperCase(),
                      )
                    : profile.country
                  : 'Not provided'}
              </Typography>
            </Box>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Age
            </Typography>
            <Typography variant="body1">
              {profile.age || 'Not provided'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {profile.languagesKnown && profile.languagesKnown.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Languages I Know
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            {profile.languagesKnown.map((lang, index) => (
              <Chip
                key={index}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <FlagIcon
                      countryCode={languageToCountryCode(lang.code)}
                      size={16}
                    />
                    <Typography variant="body2">
                      {lang.name} ({lang.level})
                    </Typography>
                  </Box>
                }
                variant="outlined"
                sx={{ mb: 1 }}
              />
            ))}
          </Box>
        </Box>
      )}

      {profile.languagesLearn && profile.languagesLearn.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Languages I'm Learning
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            {profile.languagesLearn.map((lang, index) => (
              <Chip
                key={index}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <FlagIcon
                      countryCode={languageToCountryCode(lang.code)}
                      size={16}
                    />
                    <Typography variant="body2">
                      {lang.name} ({lang.level})
                    </Typography>
                  </Box>
                }
                variant="outlined"
                sx={{ mb: 1 }}
              />
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  );
};

// Friends Section Component (defined before ProfilePage to avoid hoisting issues)
interface FriendsSectionProps {
  isOwnProfile: boolean;
  friends: User[];
  pendingRequests: any[];
  sentRequests: any[];
  friendsTabValue: number;
  onTabChange: (value: number) => void;
  onRespondRequest: (requestId: string, accept: boolean) => Promise<void>;
  accessToken?: string | null;
}

const FriendsSection = ({
  isOwnProfile,
  friends,
  pendingRequests,
  sentRequests,
  friendsTabValue,
  onTabChange,
  onRespondRequest,
  accessToken,
}: FriendsSectionProps) => {
  const navigate = useNavigate();
  const [friendAvatars, setFriendAvatars] = useState<Record<string, string>>(
    {},
  );
  const [loadedFriendAvatars, setLoadedFriendAvatars] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    const fetchFriendAvatars = async () => {
      if (!accessToken) return;

      // Collect all users that need avatars (friends + pending request senders)
      const allUsers = [
        ...friends,
        ...pendingRequests.map((req: any) => req.sender).filter(Boolean),
      ];

      const avatarPromises = allUsers.map(async (user) => {
        // Prefer thumbnail if available, fallback to full avatar
        const imagePath = user.userThumbnailUrl || user.avatarUrl;
        if (!imagePath) return null;

        try {
          const bucket = user.userThumbnailUrl ? 'userThumbnails' : 'avatars';
          const url = await getSupabaseStorageUrl(
            imagePath,
            bucket,
            accessToken,
          );
          return { id: user.id, url: url || '' };
        } catch (error) {
          console.error(`Failed to get avatar for user ${user.id}:`, error);
          return null;
        }
      });

      const results = await Promise.all(avatarPromises);
      const avatarMap: Record<string, string> = {};
      results.forEach((result) => {
        if (result && result.url) {
          avatarMap[result.id] = result.url;
        }
      });
      setFriendAvatars(avatarMap);
      // Reset loaded states when avatars change
      setLoadedFriendAvatars({});
    };

    if (friends.length > 0 || pendingRequests.length > 0) {
      fetchFriendAvatars();
    }
  }, [friends, pendingRequests, accessToken]);
  return (
    <Paper
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        mb: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <PeopleIcon color="primary" />
        <Typography variant="h5">Friends</Typography>
      </Box>

      {isOwnProfile ? (
        <Tabs
          value={friendsTabValue}
          onChange={(_, newValue) => onTabChange(newValue)}
          sx={{ mb: 3 }}
        >
          <Tab label={`Friends (${friends.length})`} />
          <Tab label={`Sent (${sentRequests.length})`} />
          <Tab label={`Received (${pendingRequests.length})`} />
        </Tabs>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Friends ({friends.length})
        </Typography>
      )}

      {/* Friends Tab */}
      <TabPanel value={friendsTabValue} index={0}>
        {friends.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {isOwnProfile
              ? "You don't have any friends yet."
              : 'No friends to display.'}
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {friends.map((friend) => (
              <Grid size={{ xs: 6, sm: 4, md: 3 }} key={friend.id}>
                <Paper
                  onClick={() => {
                    if (friend.username) {
                      navigate(`/profile/${friend.username}`);
                    }
                  }}
                  sx={{
                    cursor: friend.username ? 'pointer' : 'default',
                    border: '2px solid',
                    borderColor: 'divider',
                    p: 2,
                    textAlign: 'center',
                    '&:hover': {
                      bgcolor: friend.username ? 'action.hover' : 'transparent',
                    },
                  }}
                >
                  <Box sx={{ position: 'relative', display: 'inline-block' }}>
                    <Avatar
                      src={friendAvatars[friend.id]}
                      sx={{
                        width: { xs: 48, sm: 56 },
                        height: { xs: 48, sm: 56 },
                        mx: 'auto',
                        mb: 1,
                        bgcolor: 'primary.main',
                        opacity:
                          friendAvatars[friend.id] &&
                          !loadedFriendAvatars[friend.id]
                            ? 0
                            : 1,
                        transition: 'opacity 0.3s ease-in-out',
                      }}
                      imgProps={{
                        onLoad: () => {
                          if (friendAvatars[friend.id]) {
                            setLoadedFriendAvatars((prev) => ({
                              ...prev,
                              [friend.id]: true,
                            }));
                          }
                        },
                      }}
                    >
                      {(friend.username || friend.email || 'U')
                        .charAt(0)
                        .toUpperCase()}
                    </Avatar>
                    {friend.country && (
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 4,
                          right: 4,
                          width: 20,
                          height: 20,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                        }}
                      >
                        <FlagIcon countryCode={friend.country} size={16} />
                      </Box>
                    )}
                  </Box>
                  <Typography variant="body2" noWrap>
                    {friend.username || friend.email}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Sent Requests Tab (only for own profile) */}
      {isOwnProfile && (
        <TabPanel value={friendsTabValue} index={1}>
          {sentRequests.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No sent requests
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {sentRequests.map((request) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={request.id}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      {request.receiver?.username || request.receiver?.email}
                    </Typography>
                    <Chip
                      label="Pending"
                      size="small"
                      color="warning"
                      sx={{ mt: 1 }}
                    />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>
      )}

      {/* Received Requests Tab (only for own profile) */}
      {isOwnProfile && (
        <TabPanel value={friendsTabValue} index={2}>
          {pendingRequests.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No received requests
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {pendingRequests.map((request) => {
                const sender = request.sender;
                const senderAvatar = friendAvatars[sender?.id || ''];
                const senderAvatarLoaded =
                  loadedFriendAvatars[sender?.id || ''];
                return (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={request.id}>
                    <Paper
                      onClick={() => {
                        if (sender?.username) {
                          navigate(`/profile/${sender.username}`);
                        }
                      }}
                      sx={{
                        p: 2,
                        cursor: sender?.username ? 'pointer' : 'default',
                        '&:hover': {
                          bgcolor: sender?.username
                            ? 'action.hover'
                            : 'transparent',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          mb: 2,
                        }}
                      >
                        <Box
                          sx={{ position: 'relative', display: 'inline-block' }}
                        >
                          <Avatar
                            src={senderAvatar}
                            sx={{
                              width: { xs: 48, sm: 56 },
                              height: { xs: 48, sm: 56 },
                              bgcolor: 'primary.main',
                              opacity:
                                senderAvatar && !senderAvatarLoaded ? 0 : 1,
                              transition: 'opacity 0.3s ease-in-out',
                            }}
                            imgProps={{
                              onLoad: () => {
                                if (senderAvatar && sender?.id) {
                                  setLoadedFriendAvatars((prev) => ({
                                    ...prev,
                                    [sender.id]: true,
                                  }));
                                }
                              },
                            }}
                          >
                            {(sender?.username || sender?.email || 'U')
                              .charAt(0)
                              .toUpperCase()}
                          </Avatar>
                          {sender?.country && (
                            <Box
                              sx={{
                                position: 'absolute',
                                bottom: 4,
                                right: 4,
                                width: 20,
                                height: 20,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                              }}
                            >
                              <FlagIcon
                                countryCode={sender.country}
                                size={16}
                              />
                            </Box>
                          )}
                        </Box>
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {sender?.username || sender?.email}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 1,
                          justifyContent: 'center',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <IconButton
                          color="success"
                          onClick={() => onRespondRequest(request.id, true)}
                          size="small"
                          sx={{
                            border: '2px solid',
                            borderColor: 'success.main',
                            '&:hover': {
                              bgcolor: 'success.main',
                              color: 'white',
                            },
                            '& svg': {
                              fontSize: '1rem',
                            },
                          }}
                        >
                          <CheckIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => onRespondRequest(request.id, false)}
                          size="small"
                          sx={{
                            border: '2px solid',
                            borderColor: 'error.main',
                            '&:hover': {
                              bgcolor: 'error.main',
                              color: 'white',
                            },
                            '& svg': {
                              fontSize: '1rem',
                            },
                          }}
                        >
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </TabPanel>
      )}
    </Paper>
  );
};

export default ProfilePage;
