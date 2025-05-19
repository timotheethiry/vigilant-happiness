import { FailedLoginAttempt } from './failedLoginAttempt.entity';
import { Repository } from 'typeorm';

/**
 * Service class for managing failed login attempts by IP address.
 *
 * Responsibilities:
 * - Track and update failed login attempts per IP.
 * - Block IPs temporarily after reaching a configurable threshold.
 * - Reset attempt counters after a configurable cooldown period.
 * - Reset attempt counters after a successful login.
 *
 * Constructor parameters:
 * - blockDuration: duration of IP block (in seconds)
 * - maxFailedAttempts: number of failed attempts before blocking
 * - resetFailedAttemptsTime: time threshold to reset the attempt count (in seconds)
 *
 * Usage:
 * - Intended for injection as a service through Dependency Injection.
 * - Use a factory provider to inject both the configuration values (blockDuration, maxFailedAttempts, resetFailedAttemptsTime)
 * 		and the Repository<FailedLoginAttempt> dependency at runtime.
 */

export class LoginAttempts {
	blockDuration: number;
	maxFailedAttempts: number;
	resetFailedAttemptsTime: number;

	constructor(
		blockDuration: number = 30,
		maxFailedAttempts: number = 5,
		resetFailedAttemptsTime: number = 300,
		private ipAttemptRepo: Repository<FailedLoginAttempt>,
	) {
		this.blockDuration = blockDuration * 1000;
		this.maxFailedAttempts = maxFailedAttempts;
		this.resetFailedAttemptsTime = resetFailedAttemptsTime * 1000;
	}

	async checkIfAddressIsAlreadyBlocked(
		ip: string,
	): Promise<{ blocked: boolean; blockDurationMessage: string }> {
		const ipAttempt = await this.ipAttemptRepo.findOneBy({ ip });

		if (!ipAttempt) return { blocked: false, blockDurationMessage: '' };

		if (ipAttempt.count < this.maxFailedAttempts) {
			return { blocked: false, blockDurationMessage: '' };
		}

		if (ipAttempt.blockedUntil < Date.now()) {
			ipAttempt.count = 0;
			ipAttempt.blockedUntil = 0;

			await this.ipAttemptRepo.save(ipAttempt);

			return { blocked: false, blockDurationMessage: '' };
		}

		const remainingTime = Math.round(
			(ipAttempt.blockedUntil - Date.now()) / 1000,
		);

		return {
			blocked: true,
			blockDurationMessage: `Too many failed attempts. Please try again in ${remainingTime} seconds.`,
		};
	}

	incrementOrResetCountAttempts(
		attemptsForThisIP: FailedLoginAttempt,
		now: number,
	) {
		if (now - attemptsForThisIP.lastAttempt > this.resetFailedAttemptsTime) {
			attemptsForThisIP.count = 1;
		} else {
			attemptsForThisIP.count++;
		}
	}

	async updateFailedAttempt(
		ip: string,
	): Promise<{ remainingAttemptsMessage: string }> {
		const now = Date.now();
		let attempt: FailedLoginAttempt;
		const ipAttempt = await this.ipAttemptRepo.findOneBy({ ip });

		if (!ipAttempt) {
			attempt = {
				ip: ip,
				count: 1,
				lastAttempt: now,
				blockedUntil: 0,
			};
			const attemptInstance = this.ipAttemptRepo.create(attempt);

			await this.ipAttemptRepo.save(attemptInstance);
		} else {
			this.incrementOrResetCountAttempts(ipAttempt, now);
			ipAttempt.lastAttempt = now;
			attempt = { ...ipAttempt };

			await this.ipAttemptRepo.save(ipAttempt);
		}

		return {
			remainingAttemptsMessage: `Username or password is invalid. ${Math.max(0, this.maxFailedAttempts - attempt.count)} attempts before being blocked`,
		};
	}

	async checkIfAddressReachedMaxAttempts(
		ip: string,
	): Promise<{ blocked: boolean; blockDurationMessage: string }> {
		const ipAttempt = await this.ipAttemptRepo.findOneBy({ ip });

		if (!ipAttempt || ipAttempt.count < this.maxFailedAttempts) {
			return { blocked: false, blockDurationMessage: '' };
		} else {
			ipAttempt.blockedUntil = Date.now() + this.blockDuration;

			await this.ipAttemptRepo.save(ipAttempt);

			return {
				blocked: true,
				blockDurationMessage: `Too many failed attempts. Please try again in ${Math.round(this.blockDuration / 1000)} seconds.`,
			};
		}
	}

	async handleLoginFailure(ip: string): Promise<{
		blocked: boolean;
		messages: {
			blockDurationMessage: string;
			remainingAttemptsMessage: string;
		};
	}> {
		const { remainingAttemptsMessage } = await this.updateFailedAttempt(ip);

		const { blocked, blockDurationMessage } =
			await this.checkIfAddressReachedMaxAttempts(ip);

		return {
			blocked,
			messages: { blockDurationMessage, remainingAttemptsMessage },
		};
	}

	async resetAfterSuccessfulLogin(ip: string) {
		const ipAttempt = await this.ipAttemptRepo.findOneBy({ ip });
		if (ipAttempt) {
			ipAttempt.count = 0;
			ipAttempt.lastAttempt = Date.now();
			ipAttempt.blockedUntil = 0;

			await this.ipAttemptRepo.save(ipAttempt);
		}
	}
}
