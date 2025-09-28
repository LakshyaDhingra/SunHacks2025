'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './NavPills.css';

export type NavPillItem = {
  label: string;
  href: string;
  ariaLabel?: string;
};

export interface NavPillsProps {
  items: NavPillItem[];
  className?: string;
  baseColor?: string;
  pillColor?: string;
  hoveredPillTextColor?: string;
  pillTextColor?: string;
}

const NavPills: React.FC<NavPillsProps> = ({
  items,
  className = '',
}) => {
  const pathname = usePathname();

  const isExternalLink = (href: string) =>
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('//') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('#');

  return (
    <div className={`nav-pills-container ${className}`}>
      <div className="nav-pills-items">
        <ul className="nav-pills-list">
          {items.map((item) => (
            <li key={item.href}>
              {isExternalLink(item.href) ? (
                <a
                  href={item.href}
                  className={`nav-pill${pathname === item.href ? ' is-active' : ''}`}
                  aria-label={item.ariaLabel || item.label}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  href={item.href}
                  className={`nav-pill${pathname === item.href ? ' is-active' : ''}`}
                  aria-label={item.ariaLabel || item.label}
                >
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default NavPills;