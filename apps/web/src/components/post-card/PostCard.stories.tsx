import React from 'react';
import { Meta, Story } from '@storybook/react';
import PostCard, { PostCardProps } from './PostCard';

export default {
  title: 'Components/PostCard',
  component: PostCard,
  argTypes: {
    content: { control: 'text' },
    collapseThreshold: { control: 'number' },
    isLoading: { control: 'boolean' },
    hasError: { control: 'boolean' },
    onRetry: { action: 'onRetry' },
  },
} as Meta;

const Template: Story<PostCardProps> = (args) => <PostCard {...args} />;

const longText = Array(200)
  .fill('This is a long piece of content to demonstrate the collapse functionality. ')
  .join('');

export const Default = Template.bind({});
Default.args = {
  user: { name: 'Jane Doe' },
  avatarUrl: 'https://via.placeholder.com/150',
  timestamp: new Date().toISOString(),
  content: 'This is a sample post.',
  likesCount: 10,
  commentsCount: 2,
  collapseThreshold: 300,
  isLoading: false,
  hasError: false,
};

export const LongContentCollapsed = Template.bind({});
LongContentCollapsed.args = {
  ...Default.args,
  content: longText,
  collapseThreshold: 100,
};

export const Loading = Template.bind({});
Loading.args = {
  ...Default.args,
  isLoading: true,
};

export const Error = Template.bind({});
Error.args = {
  ...Default.args,
  hasError: true,
};
