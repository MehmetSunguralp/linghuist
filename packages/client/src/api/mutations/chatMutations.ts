import { gql } from '@apollo/client';

export const CLEAR_CHAT_MUTATION = gql`
  mutation ClearChat($chatId: String!, $userId: String!) {
    clearChat(chatId: $chatId, userId: $userId)
  }
`;

export const EDIT_MESSAGE_MUTATION = gql`
  mutation EditMessage($input: EditMessageInput!, $userId: String!) {
    editMessage(input: $input, userId: $userId) {
      id
      content
      edited
      createdAt
      senderId
    }
  }
`;

export const DELETE_MESSAGE_MUTATION = gql`
  mutation DeleteMessage($messageId: String!, $userId: String!) {
    deleteMessage(messageId: $messageId, userId: $userId) {
      id
      deleted
      content
    }
  }
`;

export const CORRECT_MESSAGE_MUTATION = gql`
  mutation CorrectMessage($input: CorrectMessageInput!, $correctorId: String!) {
    correctMessage(input: $input, correctorId: $correctorId) {
      id
      content
      correction
      originalContent
      correctedBy
    }
  }
`;

