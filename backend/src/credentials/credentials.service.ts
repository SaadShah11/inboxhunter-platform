import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Credential } from './entities/credential.entity';
import { CreateCredentialDto } from './dto/create-credential.dto';
import { UpdateCredentialDto } from './dto/update-credential.dto';

@Injectable()
export class CredentialsService {
  constructor(
    @InjectRepository(Credential)
    private credentialsRepository: Repository<Credential>,
  ) {}

  async create(userId: string, dto: CreateCredentialDto): Promise<Credential> {
    // If this is set as default, unset other defaults
    if (dto.isDefault) {
      await this.credentialsRepository.update(
        { userId, isDefault: true },
        { isDefault: false },
      );
    }

    const credential = this.credentialsRepository.create({
      userId,
      ...dto,
    });

    return this.credentialsRepository.save(credential);
  }

  async findByUser(userId: string): Promise<Credential[]> {
    return this.credentialsRepository.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async findById(id: string, userId: string): Promise<Credential | null> {
    return this.credentialsRepository.findOne({
      where: { id, userId },
    });
  }

  async getDefault(userId: string): Promise<Credential | null> {
    return this.credentialsRepository.findOne({
      where: { userId, isDefault: true },
    });
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateCredentialDto,
  ): Promise<Credential | null> {
    const credential = await this.findById(id, userId);
    if (!credential) {
      throw new NotFoundException('Credential not found');
    }

    // If setting as default, unset other defaults
    if (dto.isDefault) {
      await this.credentialsRepository.update(
        { userId, isDefault: true },
        { isDefault: false },
      );
    }

    await this.credentialsRepository.update(id, dto);
    return this.findById(id, userId);
  }

  async delete(id: string, userId: string): Promise<void> {
    const credential = await this.findById(id, userId);
    if (!credential) {
      throw new NotFoundException('Credential not found');
    }

    await this.credentialsRepository.remove(credential);
  }
}

