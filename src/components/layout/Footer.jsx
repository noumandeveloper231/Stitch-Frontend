import React from 'react'

const Footer = () => {
    return (
        <footer className="border-t border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-600 sm:px-5 md:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2">
                <p>Copyright 2026 © StitchFlow All rights reserved.</p>
                <div className="flex items-center gap-4">
                    <a href="#" className="hover:text-zinc-900">Privacy Policy</a>
                    <a href="#" className="hover:text-zinc-900">Terms &amp; Conditions</a>
                </div>
            </div>
        </footer>
    )
}

export default Footer