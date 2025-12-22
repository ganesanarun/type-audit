import {Injectable, Logger, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {DataSource, Repository} from 'typeorm';
import {Audit} from '@snow-tzu/audit';
import {User} from '../entities/user.entity';
import {Company} from '../entities/company.entity';
import {CreateUserDto, UpdateUserDto} from './dto/create-user.dto';
import {AuditService} from '../audit/audit.service';

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);

    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private dataSource: DataSource,
        private auditService: AuditService,
    ) {
    }

    async createUserWithCompany(createUserDto: CreateUserDto): Promise<User> {
        return this.dataSource.transaction(async manager => {
            const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            this.logger.debug(`Starting transaction: ${transactionId}`);

            let company: Company | undefined;
            let companyChangesCount = 0;

            // Create a company if provided
            if (createUserDto.companyName) {
                this.logger.debug(`Creating company: ${createUserDto.companyName}`);

                company = new Company();
                const auditedCompany = Audit(company);

                this.logger.debug(`Initial company state:`, {
                    name: company.name,
                    industry: company.industry,
                    description: company.description
                });

                auditedCompany.name = createUserDto.companyName;
                this.logger.debug(`After setting name, changes: ${auditedCompany.changes().length}`);

                // Explicitly set isActive to ensure it's tracked
                auditedCompany.isActive = true;
                this.logger.debug(`After setting isActive, changes: ${auditedCompany.changes().length}`);

                if (createUserDto.companyIndustry) {
                    auditedCompany.industry = createUserDto.companyIndustry;
                    this.logger.debug(`After setting industry, changes: ${auditedCompany.changes().length}`);
                }
                if (createUserDto.companyDescription) {
                    auditedCompany.description = createUserDto.companyDescription;
                    this.logger.debug(`After setting description, changes: ${auditedCompany.changes().length}`);
                }

                const savedCompany = await manager.save(Company, auditedCompany);
                const companyChanges = auditedCompany.changes();
                companyChangesCount = companyChanges.length;

                this.logger.debug(`Company created with ${companyChanges.length} tracked changes`, {
                    companyId: savedCompany.id,
                    changes: companyChanges.map(c => c.field)
                });

                // Save company audit logs
                await this.auditService.saveAuditLogs(
                    manager,
                    'Company',
                    savedCompany.id,
                    companyChanges,
                    transactionId
                );

                company = savedCompany;
            }

            // Create user
            this.logger.debug(`Creating user: ${createUserDto.name}`);

            const user = new User();
            const auditedUser = Audit(user);

            this.logger.debug(`Initial user state:`, {
                name: user.name,
                email: user.email,
                phone: user.phone
            });

            auditedUser.name = createUserDto.name;
            this.logger.debug(`After setting name, changes: ${auditedUser.changes().length}`);

            auditedUser.email = createUserDto.email;
            this.logger.debug(`After setting email, changes: ${auditedUser.changes().length}`);

            // Explicitly set isActive to ensure it's tracked
            auditedUser.isActive = true;
            this.logger.debug(`After setting isActive, changes: ${auditedUser.changes().length}`);

            if (createUserDto.phone) {
                auditedUser.phone = createUserDto.phone;
                this.logger.debug(`After setting phone, changes: ${auditedUser.changes().length}`);
            }
            if (company) {
                auditedUser.company = company;
                this.logger.debug(`After setting company, changes: ${auditedUser.changes().length}`);
            }

            const savedUser = await manager.save(User, auditedUser);
            const userChanges = auditedUser.changes();

            this.logger.debug(`User created with ${userChanges.length} tracked changes`, {
                userId: savedUser.id,
                changes: userChanges.map(c => c.field)
            });

            // Save user audit logs
            await this.auditService.saveAuditLogs(
                manager,
                'User',
                savedUser.id,
                userChanges,
                transactionId
            );

            const totalChanges = userChanges.length + companyChangesCount;

            this.logger.log(`Transaction ${transactionId} completed successfully`, {
                userId: savedUser.id,
                companyId: company?.id,
                totalChanges
            });

            return savedUser;
        });
    }

    async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<User> {
        return this.dataSource.transaction(async manager => {
            const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            this.logger.debug(`Starting update transaction: ${transactionId} for user ${id}`);

            const user = await manager.findOne(User, {
                where: {id},
                relations: ['company']
            });

            if (!user) {
                this.logger.warn(`User with ID ${id} not found`);
                throw new NotFoundException(`User with ID ${id} not found`);
            }

            this.logger.debug(`Found user: ${user.name} (${user.email})`);

            let companyChangesCount = 0;

            // Handle company updates if provided
            if (updateUserDto.companyName || updateUserDto.companyIndustry || updateUserDto.companyDescription) {
                if (user.company) {
                    // Update existing company
                    this.logger.debug(`Updating existing company: ${user.company.name}`);

                    const auditedCompany = Audit(user.company);

                    if (updateUserDto.companyName !== undefined) {
                        auditedCompany.name = updateUserDto.companyName;
                    }
                    if (updateUserDto.companyIndustry !== undefined) {
                        auditedCompany.industry = updateUserDto.companyIndustry;
                    }
                    if (updateUserDto.companyDescription !== undefined) {
                        auditedCompany.description = updateUserDto.companyDescription;
                    }

                    await manager.save(Company, auditedCompany);
                    const companyChanges = auditedCompany.changes();
                    companyChangesCount = companyChanges.length;

                    if (companyChanges.length > 0) {
                        this.logger.debug(`Company updated with ${companyChanges.length} tracked changes`, {
                            companyId: user.company.id,
                            changes: companyChanges.map(c => c.field)
                        });

                        await this.auditService.saveAuditLogs(
                            manager,
                            'Company',
                            user.company.id,
                            companyChanges,
                            transactionId
                        );
                    }
                } else {
                    // Create a new company
                    this.logger.debug(`Creating new company for user ${id}`);

                    const company = new Company();
                    const auditedCompany = Audit(company);

                    if (updateUserDto.companyName) {
                        auditedCompany.name = updateUserDto.companyName;
                    }
                    if (updateUserDto.companyIndustry) {
                        auditedCompany.industry = updateUserDto.companyIndustry;
                    }
                    if (updateUserDto.companyDescription) {
                        auditedCompany.description = updateUserDto.companyDescription;
                    }

                    const savedCompany = await manager.save(Company, auditedCompany);
                    const companyChanges = auditedCompany.changes();
                    companyChangesCount = companyChanges.length;

                    this.logger.debug(`New company created with ${companyChanges.length} tracked changes`, {
                        companyId: savedCompany.id,
                        changes: companyChanges.map(c => c.field)
                    });

                    await this.auditService.saveAuditLogs(
                        manager,
                        'Company',
                        savedCompany.id,
                        companyChanges,
                        transactionId
                    );

                    // Associate company with a user
                    user.company = savedCompany;
                }
            }

            // Create audited wrapper for user
            const auditedUser = Audit(user);

            // Track what fields are being updated
            const fieldsToUpdate: string[] = [];

            // Apply user updates
            if (updateUserDto.name !== undefined) {
                auditedUser.name = updateUserDto.name;
                fieldsToUpdate.push('name');
            }
            if (updateUserDto.email !== undefined) {
                auditedUser.email = updateUserDto.email;
                fieldsToUpdate.push('email');
            }
            if (updateUserDto.phone !== undefined) {
                auditedUser.phone = updateUserDto.phone;
                fieldsToUpdate.push('phone');
            }
            if (updateUserDto.isActive !== undefined) {
                auditedUser.isActive = updateUserDto.isActive;
                fieldsToUpdate.push('isActive');
            }

            this.logger.debug(`Updating user fields: ${fieldsToUpdate.join(', ')}`);

            const savedUser = await manager.save(User, auditedUser);

            // Save audit logs for user changes
            const userChanges = auditedUser.changes();
            if (userChanges.length > 0) {
                this.logger.debug(`Saving ${userChanges.length} user audit log entries`, {
                    changes: userChanges.map(c => ({field: c.field, oldValue: c.oldValue, newValue: c.newValue}))
                });

                await this.auditService.saveAuditLogs(
                    manager,
                    'User',
                    savedUser.id,
                    userChanges,
                    transactionId
                );
            }

            const totalChanges = userChanges.length + companyChangesCount;

            if (totalChanges > 0) {
                this.logger.log(`User ${id} updated successfully with ${totalChanges} total tracked changes`, {
                    transactionId,
                    userId: savedUser.id,
                    userChanges: userChanges.length,
                    companyChanges: companyChangesCount,
                    changedFields: userChanges.map(c => c.field)
                });
            } else {
                this.logger.debug(`No changes detected for user ${id}`);
            }

            return savedUser;
        });
    }

    async findAll(): Promise<User[]> {
        return this.userRepository.find({
            relations: ['company'],
            order: {createdAt: 'DESC'}
        });
    }

    async findOne(id: number): Promise<User> {
        const user = await this.userRepository.findOne({
            where: {id},
            relations: ['company']
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        return user;
    }
}