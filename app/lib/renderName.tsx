import React from 'react';

export function renderName(name: string) {
  if (name && name.includes('(EXTRA)')) {
    return <span style={{ color: 'red', fontWeight: 'bold' }}>{name}</span>;
  }
  return name;
} 