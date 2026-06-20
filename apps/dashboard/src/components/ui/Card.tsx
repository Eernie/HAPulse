import React from 'react';
import './Card.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean;
  as?: React.ElementType;
}

export function Card({ active, as: Tag = 'div', className = '', children, ...rest }: CardProps) {
  const classes = ['card', active ? 'card--active' : '', className].filter(Boolean).join(' ');
  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}
