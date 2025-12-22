import {Controller, Get, Logger, Param, ParseIntPipe, Query} from '@nestjs/common';
import {AuditService} from './audit.service';

@Controller('audit-logs')
export class AuditController {
    private readonly logger = new Logger(AuditController.name);

    constructor(private readonly auditService: AuditService) {
    }

    @Get()
    async getAuditLogs(
        @Query('entityType') entityType?: string,
        @Query('entityId') entityId?: string,
        @Query('transactionId') transactionId?: string,
        @Query('limit') limit?: string
    ) {
        const filters = {
            entityType,
            entityId: entityId ? parseInt(entityId) : undefined,
            transactionId,
            limit: limit ? parseInt(limit) : 50
        };

        this.logger.log('Retrieving audit logs', {filters});

        const logs = await this.auditService.getAuditLogs(filters);

        this.logger.log(`Retrieved ${logs.length} audit logs`, {
            count: logs.length,
            filters
        });

        return {
            message: 'Audit logs retrieved successfully',
            count: logs.length,
            logs: logs.map(log => ({
                id: log.id,
                entityType: log.entityType,
                entityId: log.entityId,
                fieldName: log.fieldName,
                oldValue: log.oldValue,
                newValue: log.newValue,
                transactionId: log.transactionId,
                createdAt: log.createdAt
            }))
        };
    }

    @Get('entity/:entityType/:entityId')
    async getEntityAuditLogs(
        @Param('entityType') entityType: string,
        @Param('entityId', ParseIntPipe) entityId: number
    ) {
        const logs = await this.auditService.getEntityAuditLogs(entityType, entityId);

        return {
            message: `Audit logs for ${entityType} ${entityId} retrieved successfully`,
            logs: logs.map(log => ({
                id: log.id,
                fieldName: log.fieldName,
                oldValue: log.oldValue,
                newValue: log.newValue,
                transactionId: log.transactionId,
                createdAt: log.createdAt
            }))
        };
    }

    @Get('transaction/:transactionId')
    async getTransactionAuditLogs(@Param('transactionId') transactionId: string) {
        const logs = await this.auditService.getTransactionAuditLogs(transactionId);

        return {
            message: `Audit logs for transaction ${transactionId} retrieved successfully`,
            logs: logs.map(log => ({
                id: log.id,
                entityType: log.entityType,
                entityId: log.entityId,
                fieldName: log.fieldName,
                oldValue: log.oldValue,
                newValue: log.newValue,
                createdAt: log.createdAt
            }))
        };
    }
}