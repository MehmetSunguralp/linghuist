import { gql } from '@apollo/client';

export const MY_CHATS_QUERY = gql`
  query MyChats($userId: String!) {
    myChats(userId: $userId) {
      id
      createdAt
      updatedAt
      participants {
        id
        userId
        user {
          id
          username
          name
          avatarUrl
          userThumbnailUrl
          country
          isOnline
        }
      }
      messages {
        id
        content
        type
        mediaUrl
        createdAt
        senderId
        read
        edited
        deleted
        correctedBy
        correction
        originalContent
      }
    }
  }
`;

export const GET_MESSAGES_QUERY = gql`
  query GetMessages($chatId: String!, $take: Int, $cursor: String) {
    getMessages(chatId: $chatId, take: $take, cursor: $cursor) {
      messages {
        id
        content
        type
        mediaUrl
        createdAt
        senderId
        receiverId
        read
        edited
        deleted
        correctedBy
        correction
        originalContent
        sender {
          id
          username
          name
          avatarUrl
        }
      }
      hasMore
      nextCursor
    }
  }
`;

