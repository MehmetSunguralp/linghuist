import { gql } from '@apollo/client';

export const GET_USERS = gql`
  query GetUsers {
    users {
      id
      name
      email
      username
      avatarUrl
      bio
      country
      age
      languagesKnown {
        name
        level
        code
      }
      languagesLearn {
        name
        level
        code
      }
    }
  }
`;

export const GET_FRIENDS = gql`
  query GetFriends {
    friends {
      id
      name
      email
      username
      avatarUrl
      bio
      country
      age
      languagesKnown {
        name
        level
        code
      }
      languagesLearn {
        name
        level
        code
      }
    }
  }
`;

export const GET_USER_BY_ID = gql`
  query GetUserById($id: String!) {
    user(id: $id) {
      id
      email
      name
      username
      bio
      avatarUrl
      country
      age
      role
      isVerified
      languagesKnown {
        name
        level
        code
      }
      languagesLearn {
        name
        level
        code
      }
    }
  }
`;

export const SEND_FRIEND_REQUEST = gql`
  mutation SendFriendRequest($receiverId: String!) {
    sendFriendRequest(receiverId: $receiverId) {
      id
      status
      sender {
        id
        name
        username
      }
      receiver {
        id
        name
        username
      }
    }
  }
`;

export const GET_PENDING_FRIEND_REQUESTS = gql`
  query GetPendingFriendRequests {
    pendingFriendRequests {
      id
      status
      sender {
        id
        name
        username
        email
        avatarUrl
        bio
        country
        age
        languagesKnown {
          name
          level
          code
        }
        languagesLearn {
          name
          level
          code
        }
      }
      receiver {
        id
        name
        username
        email
        avatarUrl
        bio
        country
        age
        languagesKnown {
          name
          level
          code
        }
        languagesLearn {
          name
          level
          code
        }
      }
    }
  }
`;

export const GET_SENT_FRIEND_REQUESTS = gql`
  query GetSentFriendRequests {
    sentFriendRequests {
      id
      status
      sender {
        id
        name
        username
        email
        avatarUrl
        bio
        country
        age
        languagesKnown {
          name
          level
          code
        }
        languagesLearn {
          name
          level
          code
        }
      }
      receiver {
        id
        name
        username
        email
        avatarUrl
        bio
        country
        age
        languagesKnown {
          name
          level
          code
        }
        languagesLearn {
          name
          level
          code
        }
      }
    }
  }
`;

export const REMOVE_FRIEND = gql`
  mutation RemoveFriend($friendId: String!) {
    removeFriend(friendId: $friendId)
  }
`;

export const RESPOND_FRIEND_REQUEST = gql`
  mutation RespondFriendRequest($requestId: String!, $accept: Boolean!) {
    respondFriendRequest(requestId: $requestId, accept: $accept) {
      id
      status
      sender {
        id
        name
        username
      }
      receiver {
        id
        name
        username
      }
    }
  }
`;
