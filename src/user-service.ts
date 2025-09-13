import { PrismaClient } from '@prisma/client';
import type { User } from '@prisma/client';

const prisma = new PrismaClient();

export const createUser = async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
  return prisma.user.create({
    data: userData,
  });
};

export const getAllUsers = async (): Promise<User[]> => {
  return prisma.user.findMany();
};

export const getUserById = async (id: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { id },
  });
};

export const updateUser = async (id: string, userData: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>): Promise<User | null> => {
  return prisma.user.update({
    where: { id },
    data: userData,
  });
};

export const deleteUser = async (id: string): Promise<User | null> => {
  return prisma.user.delete({
    where: { id },
  });
}; 