import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signAuthToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check for Capsule Office credentials
    if (cleanEmail === 'capsuleoffice@gmail.com' && password === 'capsulework1519') {
      let user = await prisma.user.findUnique({
        where: { email: 'capsuleoffice@gmail.com' }
      });

      if (!user) {
        const passwordHash = await bcrypt.hash('capsulework1519', 10);
        user = await prisma.user.create({
          data: {
            name: 'Capsule Office',
            email: 'capsuleoffice@gmail.com',
            passwordHash,
            role: 'ADMIN',
            phone: '+91 96321 24422'
          }
        });
      }

      const token = signAuthToken({
        userId: user.id,
        name: user.name,
        email: user.email,
        role: 'ADMIN'
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: 'ADMIN'
        }
      });

      response.cookies.set('capsule_auth', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7
      });

      return response;
    }

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = signAuthToken({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role as 'ADMIN' | 'STAFF'
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

    // Set HTTP-only secure cookie
    response.cookies.set('capsule_auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred during login' }, { status: 500 });
  }
}
