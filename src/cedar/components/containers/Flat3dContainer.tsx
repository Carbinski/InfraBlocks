import { cn } from '@/lib/utils';
import { HTMLMotionProps, motion } from 'framer-motion';
import React from 'react';

interface Flat3dContainerProps extends Omit<HTMLMotionProps<'div'>, 'onDrag'> {
	children: React.ReactNode;
	/**
	 * Whether to force dark theme styling. Otherwise derives from Cedar styling store when available.
	 */
	isDarkTheme?: boolean;
	/**
	 * Optional primary colour used to tint shadows/highlights.
	 */
	primaryColor?: string;
	className?: string;
	layoutId?: string;
}

const Flat3dContainer: React.FC<Flat3dContainerProps> = ({
	children,
	isDarkTheme = false,
	primaryColor,
	className = '',
	layoutId,
	style,
	...props
}) => {
	// Simplified styling without cedar-os dependencies
	const darkThemeEnabled = isDarkTheme;

	// ------------------------------------------------------------------
	// Background + edge shadow configuration
	// ------------------------------------------------------------------
	let backgroundStyle: React.CSSProperties;
	let edgeShadow: string;

	if (primaryColor) {
		// Simple gradient using the primary color
		backgroundStyle = {
			background: `linear-gradient(to bottom, ${primaryColor}dd, ${primaryColor}aa)`,
		};
		edgeShadow = `0px 1px 0px 0px ${primaryColor}80, 0 4px 6px 0 rgba(0,0,0,0.20)`;
	} else {
		// Theme-based defaults
		backgroundStyle = darkThemeEnabled
			? {
					background: `linear-gradient(to bottom, rgb(38,38,38), rgb(20,20,20))`,
			  }
			: {
					background: `linear-gradient(to bottom, #FAFAFA, #F0F0F0)`,
			  };

		edgeShadow = darkThemeEnabled
			? `0px 1px 0px 0px rgba(255,255,255,0.1), 0 4px 6px 0 rgba(0,0,0,0.20)`
			: `0px 1px 0px 0px rgba(0,0,0,0.1), 0 4px 6px 0 rgba(0,0,0,0.35)`;
	}

	return (
		<motion.div
			layoutId={layoutId}
			className={cn('rounded-lg w-full', className)}
			style={{
				boxShadow: `${edgeShadow}`,
				willChange: 'box-shadow',
				...backgroundStyle,
				...style,
			}}
			{...props}>
			{children}
		</motion.div>
	);
};

export default Flat3dContainer;