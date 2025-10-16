<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class TechnicalFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'document' => $this->faker->unique()->numerify('##########'),
            'phone' => $this->faker->phoneNumber(),
            'address' => $this->faker->address(),
            'status' => $this->faker->randomElement(['active', 'inactive']),
            
            // Información Personal
            'blood_type' => $this->faker->randomElement(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
            'photo_url' => $this->faker->optional(0.7)->imageUrl(400, 400, 'people'),
            
            // Información Laboral
            'specialty' => $this->faker->randomElement([
                'Mantenimiento Industrial',
                'Mantenimiento Eléctrico',
                'Mantenimiento Mecánico',
                'Mantenimiento de Equipos',
                'Técnico en Refrigeración',
                'Técnico en Lavandería Industrial'
            ]),
            'hire_date' => $this->faker->dateTimeBetween('-3 years', 'now'),
            'contract_type' => $this->faker->randomElement(['full_time', 'part_time', 'contractor']),
            
            // Documentos PDF (nombres de archivos simulados)
            'eps_pdf_url' => $this->faker->optional(0.8)->randomElement([
                'eps_carnet_001.pdf',
                'eps_carnet_002.pdf',
                'eps_carnet_003.pdf'
            ]),
            'arl_pdf_url' => $this->faker->optional(0.8)->randomElement([
                'arl_carnet_001.pdf',
                'arl_carnet_002.pdf',
                'arl_carnet_003.pdf'
            ]),
            'pension_pdf_url' => $this->faker->optional(0.8)->randomElement([
                'pension_carnet_001.pdf',
                'pension_carnet_002.pdf',
                'pension_carnet_003.pdf'
            ]),
        ];
    }

    /**
     * Estado para técnico activo
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
        ]);
    }

    /**
     * Estado para técnico inactivo
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'inactive',
        ]);
    }

    /**
     * Técnico con contrato de tiempo completo
     */
    public function fullTime(): static
    {
        return $this->state(fn (array $attributes) => [
            'contract_type' => 'full_time',
        ]);
    }

    /**
     * Técnico con contrato de medio tiempo
     */
    public function partTime(): static
    {
        return $this->state(fn (array $attributes) => [
            'contract_type' => 'part_time',
        ]);
    }

    /**
     * Técnico contratista
     */
    public function contractor(): static
    {
        return $this->state(fn (array $attributes) => [
            'contract_type' => 'contractor',
        ]);
    }

    /**
     * Técnico con todos los documentos PDF
     */
    public function withDocuments(): static
    {
        return $this->state(fn (array $attributes) => [
            'eps_pdf_url' => 'eps_carnet_' . $this->faker->unique()->numerify('###') . '.pdf',
            'arl_pdf_url' => 'arl_carnet_' . $this->faker->unique()->numerify('###') . '.pdf',
            'pension_pdf_url' => 'pension_carnet_' . $this->faker->unique()->numerify('###') . '.pdf',
        ]);
    }

    /**
     * Técnico sin documentos PDF
     */
    public function withoutDocuments(): static
    {
        return $this->state(fn (array $attributes) => [
            'eps_pdf_url' => null,
            'arl_pdf_url' => null,
            'pension_pdf_url' => null,
        ]);
    }

    /**
     * Técnico con foto de perfil
     */
    public function withPhoto(): static
    {
        return $this->state(fn (array $attributes) => [
            'photo_url' => $this->faker->imageUrl(400, 400, 'people'),
        ]);
    }

    /**
     * Técnico sin foto de perfil
     */
    public function withoutPhoto(): static
    {
        return $this->state(fn (array $attributes) => [
            'photo_url' => null,
        ]);
    }
}
