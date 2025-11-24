import React from 'react';
import { motion } from 'framer-motion';

const Cup = ({ active, onClick }) => {
    return (
        <motion.div
            onClick={onClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            animate={{
                opacity: active ? 1 : 0.3,
                scale: active ? 1 : 0.8,
                filter: active ? 'grayscale(0%)' : 'grayscale(100%) opacity(30%)'
            }}
            className={`w-14 h-14 md:w-16 md:h-16 rounded-full cursor-pointer relative flex items-center justify-center shadow-xl transition-all duration-300 ${active ? 'bg-red-600 shadow-red-600/40' : 'bg-gray-800 border-2 border-gray-700'}`}
        >
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-4 ${active ? 'border-white/20 bg-red-500' : 'border-gray-600 bg-gray-700'}`}></div>
            {/* Liquid effect / Highlight */}
            {active && (
                <div className="absolute top-2 right-2 w-3 h-3 bg-white/40 rounded-full blur-[1px]"></div>
            )}
        </motion.div>
    );
};

export default Cup;
