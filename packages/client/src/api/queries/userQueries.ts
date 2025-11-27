import { gql } from '@apollo/client';

export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      username
      name
      avatarUrl
      userThumbnailUrl
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
      userThumbnailUrl
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

export const USER_BY_USERNAME_QUERY = gql`
  query UserByUsername($username: String!) {
    userByUsername(username: $username) {
      id
      email
      username
      name
      avatarUrl
      userThumbnailUrl
      bio
      role
      isVerified
      isOnline
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
      userThumbnailUrl
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

export const DISCOVER_USERS_QUERY = gql`
  query DiscoverUsers($filter: DiscoverUsersFilterInput) {
    discoverUsers(filter: $filter) {
      id
      email
      username
      name
      avatarUrl
      userThumbnailUrl
      bio
      country
      age
      isOnline
      lastOnline
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
