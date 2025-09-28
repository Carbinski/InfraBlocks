import { cn } from '@/lib/utils';
import { HTMLMotionProps, motion } from 'framer-motion';
import React from 'react';

interface Container3DProps {
	children: React.ReactNode;
	/**
	 * Primary background colour for the container. Falls back to DEFAULT_COLOR from the styling slice.
	 */
	color?: string;
	/** Optional id forwarded to the underlying div */
	id?: string;
	/**
	 * Additional Tailwind classes to override/extend the defaults.
	 */
	className?: string;
	/** Inline styles to apply to the container element */
	style?: React.CSSProperties;
	/**
	 * Any additional props that should be forwarded directly to the underlying motion.div.
	 */
	motionProps?: HTMLMotionProps<'div'>;
}

const Container3D: React.FC<Container3DProps> = ({
	children,
	className = '',
	motionProps = {},
	id,
	style,
	color,
}) => {
	// Simplified styling without cedar-os dependencies
	const isDarkMode = false; // Default to light mode
	const shadeBase = color || '#ffffff';

	const restMotionProps = motionProps;

	// Static 3-D shadow styles
	const baseStyle: React.CSSProperties = {
		boxShadow: [
			'0px 2px 0px 0px rgba(0,0,0,0.1)',
			'-12px 18px 16px 0px rgba(0,0,0,0.14)',
			'-6px 10px 8px 0px rgba(0,0,0,0.14)',
			'-2px 4px 3px 0px rgba(0,0,0,0.15)',
			'-1px 2px 3px 0px rgba(0,0,0,0.12) inset',
		].join(', '),
		willChange: 'transform, backdrop-filter',
		transform: 'translateZ(0)',
	};

	// Combine base style, color override, and inline style from props
	const colorStyle: React.CSSProperties = color
		? { backgroundColor: color, borderColor: color }
		: {};
	const combinedStyle: React.CSSProperties = {
		...baseStyle,
		...colorStyle,
		...style,
	};

	return (
		<motion.div
			id={id}
			className={cn(
				'w-full h-full rounded-xl border-[3px] backdrop-blur-[12px]',
				// Only apply default border/background when no custom color provided
				!color &&
					(isDarkMode
						? 'border-gray-700 bg-black/40'
						: 'border-white bg-[#FAF9F580]'),
				className
			)}
			style={combinedStyle}
			{...restMotionProps}>
			{children}
		</motion.div>
	);
};

export default Container3D;
