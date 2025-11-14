import { gql } from '@apollo/client';

export const UPDATE_ME_MUTATION = gql`
  mutation UpdateMe($data: UpdateUserInput!) {
    updateMe(data: $data) {
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

export const SEND_FRIEND_REQUEST_MUTATION = gql`
  mutation SendFriendRequest($receiverId: String!) {
    sendFriendRequest(receiverId: $receiverId) {
      id
      sender {
        id
        email
        username
      }
      receiver {
        id
        email
        username
      }
      status
    }
  }
`;

export const RESPOND_FRIEND_REQUEST_MUTATION = gql`
  mutation RespondFriendRequest($requestId: String!, $accept: Boolean!) {
    respondFriendRequest(requestId: $requestId, accept: $accept) {
      id
      sender {
        id
        email
        username
      }
      receiver {
        id
        email
        username
      }
      status
    }
  }
`;

export const REMOVE_FRIEND_MUTATION = gql`
  mutation RemoveFriend($friendId: String!) {
    removeFriend(friendId: $friendId)
  }
`;
