import React from 'react';
import { render } from '@testing-library/react-native';
import { Paragraph } from '@/components/snippet/Paragraph';

describe('Paragraph', () => {
  it('renders text content', () => {
    const { getByDisplayValue } = render(
      <Paragraph text="This is a paragraph." fontSize={16} color="#000" />
    );
    expect(getByDisplayValue('This is a paragraph.')).toBeTruthy();
  });

  it('returns null for empty text', () => {
    const { toJSON } = render(
      <Paragraph text="   " fontSize={16} color="#000" />
    );
    expect(toJSON()).toBeNull();
  });

  it('trims whitespace', () => {
    const { getByDisplayValue } = render(
      <Paragraph text="  Hello  " fontSize={16} color="#000" />
    );
    expect(getByDisplayValue('Hello')).toBeTruthy();
  });

  it('renders with highlight query', () => {
    const { getByText } = render(
      <Paragraph text="Karma yoga" fontSize={16} color="#000" highlightQuery="karma" />
    );
    expect(getByText('Karma')).toBeTruthy();
  });
});
