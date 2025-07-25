import request from 'supertest';
import app from '../app';

describe('Payment API', () => {
  it('should create a payment', async () => {
    // You may need to adjust the order id and token for your environment
    const res = await request(app)
      .post('/api/payments')
      .send({
        order: { id: 1 },
        amount: 100,
        method: 'cash',
        status: 'completed'
      })
      // .set('Authorization', 'Bearer <your_test_token>'); // Uncomment and set if auth is required
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.status).toBe('completed');
    expect(res.body.paidAt).toBeTruthy();
  });
}); 