import React from 'react';
import { Link } from 'react-router-dom';
import { Separator } from '../ui/separator';

const MarketingFooter = () => {
  return (
    <footer className='border-t bg-background'>
      <div className='container mx-auto max-w-screen-xl px-4 py-8'>
        <div className='grid grid-cols-2 gap-8 md:grid-cols-4'>
          <div>
            <h3 className='mb-3 text-sm font-semibold'>产品</h3>
            <ul className='space-y-2 text-sm text-muted-foreground'>
              <li>
                <Link to='/' className='hover:text-foreground'>
                  概览
                </Link>
              </li>
              <li>
                <Link to='/pricing' className='hover:text-foreground'>
                  定价
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className='mb-3 text-sm font-semibold'>文档</h3>
            <ul className='space-y-2 text-sm text-muted-foreground'>
              <li>
                <Link to='/docs' className='hover:text-foreground'>
                  快速开始
                </Link>
              </li>
              <li>
                <Link to='/docs/api' className='hover:text-foreground'>
                  API 文档
                </Link>
              </li>
              <li>
                <Link to='/docs/sdk' className='hover:text-foreground'>
                  SDK 指南
                </Link>
              </li>
              <li>
                <Link to='/docs/tools' className='hover:text-foreground'>
                  工具对接
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className='mb-3 text-sm font-semibold'>法律</h3>
            <ul className='space-y-2 text-sm text-muted-foreground'>
              <li>
                <Link to='/terms' className='hover:text-foreground'>
                  服务条款
                </Link>
              </li>
              <li>
                <Link to='/privacy' className='hover:text-foreground'>
                  隐私政策
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className='mb-3 text-sm font-semibold'>支持</h3>
            <ul className='space-y-2 text-sm text-muted-foreground'>
              <li>
                <Link to='/docs' className='hover:text-foreground'>
                  帮助中心
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <Separator className='my-6' />
        <div className='flex flex-col items-center justify-between gap-4 md:flex-row'>
          <p className='text-sm text-muted-foreground'>
            &copy; {new Date().getFullYear()} CodingPlan. 保留所有权利。
          </p>
        </div>
      </div>
    </footer>
  );
};

export default MarketingFooter;
