import React from 'react';

export default function Logo({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <path fill="currentColor" d="M0 55 55 0v27c0 15.464-12.536 28-28 28zm45 18c0-15.464 12.536-28 28-28h27l-55 55z" />
        </svg>
    );
}
