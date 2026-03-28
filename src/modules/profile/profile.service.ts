import { Injectable } from '@nestjs/common';

@Injectable()
export class ProfileService {
    async getProfile() {
        return 'This action returns a profile';
    }
    async updateProfile() {
        return 'This action updates a profile';
    }
    async deleteProfile() {
        return 'This action deletes a profile';
    }
    async createProfile() {
        return 'This action creates a profile';
    }
}
