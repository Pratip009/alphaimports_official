'use client';
import BlogEditor from '../BlogEditor';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewBlogPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/blogs" className="flex items-center gap-1.5 text-[0.7rem] text-[#7f7f7f] hover:text-[#1c4874] transition-colors">
          <ArrowLeft size={13} strokeWidth={2} /> Back
        </Link>
        <span className="text-[#999999]">/</span>
        <span className="text-[0.7rem] font-semibold text-[#222222]">New Post</span>
      </div>
      <div className="mb-6">
        <p className="text-[0.68rem] tracking-[0.22em] uppercase text-[#1c4874] font-semibold mb-2">◆ Content Management</p>
        <h1 className=" text-[2.4rem] font-medium text-[#222222] leading-none">Create New Post</h1>
      </div>
      <div className="mb-6 h-px bg-gradient-to-r from-[#1c4874]/30 via-[#e3e6ee] to-transparent" />
      <BlogEditor />
    </div>
  );
}