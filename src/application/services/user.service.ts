import { getUserByPhone, createUser, updateUser, isUserKnown } from '@/infrastructure/database/queries/users.queries'
import { logger } from '@/infrastructure/utils/logger'
import type { Users } from '@/infrastructure/database/types'

export class UserService {
  async getOrCreateUser(
    tenantId: string,
    phoneNumber: string,
    profileName?: string
  ): Promise<any> {
    try {
      // Try to find existing user
      let user = await getUserByPhone(tenantId, phoneNumber)

      if (user) {
        logger.debug('Found existing user', { userId: user.id })
        return user
      }

      // Create new user
      logger.info('Creating new user', { tenantId, phoneNumber })
      user = await createUser({
        tenant_id: tenantId,
        phone_number: phoneNumber,
        name: profileName,
      })

      return user
    } catch (error) {
      logger.error('Error in getOrCreateUser', error)
      throw error
    }
  }

  async updateUserProfile(
    userId: string,
    data: { name?: string; email?: string }
  ): Promise<any> {
    try {
      const user = await updateUser(userId, data)
      logger.info('Updated user profile', { userId, data })
      return user
    } catch (error) {
      logger.error('Error updating user profile', error)
      throw error
    }
  }

  async isKnownUser(tenantId: string, phoneNumber: string): Promise<boolean> {
    return await isUserKnown(tenantId, phoneNumber)
  }
}

export const userService = new UserService()
