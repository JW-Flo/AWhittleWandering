import { ChargeRepository } from '../repositories/charge-repository';
import { ChargeInput, ChargeRecord } from '../types/charge';
import { PaymentGateway } from '../integrations/payment-gateway';

export class ChargeService {
  private chargeRepository: ChargeRepository;
  private paymentGateway: PaymentGateway;

  constructor(
    chargeRepository: ChargeRepository, 
    paymentGateway: PaymentGateway
  ) {
    this.chargeRepository = chargeRepository;
    this.paymentGateway = paymentGateway;
  }

  async processCharge(input: ChargeInput): Promise<ChargeRecord> {
    try {
      // Create initial charge record
      const charge = await this.chargeRepository.createCharge(input);

      // Process payment through gateway
      const paymentResult = await this.paymentGateway.processPayment({
        amount: input.amount,
        currency: input.currency,
        customerId: input.customerId
      });

      // Update charge status based on payment result
      const finalStatus = paymentResult.success ? 'completed' : 'failed';
      const updatedCharge = await this.chargeRepository.updateChargeStatus(
        charge.id, 
        finalStatus
      );

      return updatedCharge || charge;
    } catch (error) {
      console.error('Charge processing failed:', error);
      await this.chargeRepository.updateChargeStatus(
        charge.id, 
        'failed'
      );
      throw new Error('Charge processing failed');
    }
  }
}