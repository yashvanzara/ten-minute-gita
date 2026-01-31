import React from 'react';
import { render } from '@testing-library/react-native';
import { HighlightText } from '@/components/snippet/HighlightText';

describe('HighlightText', () => {
  it('renders plain text when no query', () => {
    const { getByDisplayValue } = render(<HighlightText text="Hello world" color="#000" />);
    expect(getByDisplayValue('Hello world')).toBeTruthy();
  });

  it('renders plain text when query is empty', () => {
    const { getByDisplayValue } = render(<HighlightText text="Hello world" query="" color="#000" />);
    expect(getByDisplayValue('Hello world')).toBeTruthy();
  });

  it('highlights matching text (case-insensitive)', () => {
    const { getByText } = render(<HighlightText text="Karma yoga path" query="karma" color="#000" />);
    expect(getByText('Karma')).toBeTruthy();
    expect(getByText(' yoga path')).toBeTruthy();
  });

  it('highlights multiple occurrences', () => {
    const { getAllByText } = render(
      <HighlightText text="the the the" query="the" color="#000" />
    );
    expect(getAllByText('the')).toHaveLength(3);
  });

  it('renders normally when query not found', () => {
    const { getByText } = render(<HighlightText text="Hello world" query="xyz" color="#000" />);
    expect(getByText('Hello world')).toBeTruthy();
  });
});
