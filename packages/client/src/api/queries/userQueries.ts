import { gql } from '@apollo/client';

export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      username
      name
      avatarUrl
      bio
      role
      isVerified
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

export const USER_QUERY = gql`
  query User($id: String!) {
    user(id: $id) {
      id
      email
      username
      name
      avatarUrl
      bio
      role
      isVerified
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

export const FRIENDS_QUERY = gql`
  query Friends {
    friends {
      id
      email
      username
      name
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

export const PENDING_FRIEND_REQUESTS_QUERY = gql`
  query PendingFriendRequests {
    pendingFriendRequests {
      id
      sender {
        id
        email
        username
        name
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
        email
        username
        name
        avatarUrl
        bio
        country
        age
      }
      status
      createdAt
    }
  }
`;

export const SENT_FRIEND_REQUESTS_QUERY = gql`
  query SentFriendRequests {
    sentFriendRequests {
      id
      sender {
        id
        email
        username
        name
        avatarUrl
        bio
        country
        age
      }
      receiver {
        id
        email
        username
        name
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
      status
      createdAt
    }
  }
`;
