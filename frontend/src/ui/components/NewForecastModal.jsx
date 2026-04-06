import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { createForecast } from "@/api/forecastsService.js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api.js";
import {
  Box,
  VStack,
  HStack,
  Button,
  Input,
  Select,
  useColorModeValue,
  Text
} from "@chakra-ui/react";

export function NewForecastModal({ date = null, onClose }) {
  const queryClient = useQueryClient();
  const [isCreatingCounterparty, setIsCreatingCounterparty] = useState(false);
  const [newCounterpartyName, setNewCounterpartyName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      date: date || "",
      amount: "",
      account: "",
      type: "out",
      category: "",
      counterparty: "",
      concept: "",
    },
  });
  const selectedCounterparty = watch("counterparty");

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => api.get("/accounts").then((r) => r.data),
  });

  const { data: counterparties = [] } = useQuery({
    queryKey: ["counterparties"],
    queryFn: () => api.get("/counterparties").then((r) => r.data),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get("/categories").then((r) => r.data),
  });

  useEffect(() => {
    if (date) reset((v) => ({ ...v, date }));
  }, [date, reset]);

  const normalizedCounterparties = useMemo(
    () =>
      counterparties.map((c) => ({
        ...c,
        normalizedName: String(c.name || "").trim().toLocaleLowerCase("es-ES"),
      })),
    [counterparties]
  );

  //const bgCard = useColorModeValue("neutral.100", "neutral.800");
  const inputBg = useColorModeValue("neutral.50", "neutral.700");
  const inputColor = useColorModeValue("neutral.800", "neutral.100");
  const placeholderColor = useColorModeValue("gray.400", "gray.500");
  const buttonBg = useColorModeValue("brand.500", "accent.500");
  const buttonColor = useColorModeValue("white", "black");
  const buttonHover = useColorModeValue("brand.600", "accent.600");
  const buttonSecondaryBg = useColorModeValue("neutral.300", "neutral.600");
  const buttonSecondaryHover = useColorModeValue("neutral.400", "neutral.500");

  const resolveCounterpartyId = async () => {
    if (!isCreatingCounterparty) return selectedCounterparty || undefined;

    const name = newCounterpartyName.trim();
    if (!name) {
      throw new Error("EMPTY_COUNTERPARTY_NAME");
    }

    const normalizedName = name.toLocaleLowerCase("es-ES");
    const existing = normalizedCounterparties.find((c) => c.normalizedName === normalizedName);
    if (existing?._id) {
      setValue("counterparty", existing._id);
      return existing._id;
    }

    const { data } = await api.post("/counterparties", { name });
    await queryClient.invalidateQueries({ queryKey: ["counterparties"] });
    setValue("counterparty", data?._id || "");
    return data?._id || undefined;
  };

  const onSubmit = async (vals) => {
    try {
      setIsSubmitting(true);
      const counterpartyId = await resolveCounterpartyId();
      const payload = {
        ...vals,
        amount: Number(vals.amount),
        date: vals.date ? new Date(vals.date).toISOString() : undefined,
        category: vals.category || undefined,
        counterparty: counterpartyId,
      };

      await createForecast(payload);
      onClose();
    } catch (err) {
      console.error("Error al crear forecast:", err.response?.data || err.message);
      if (err.message === "EMPTY_COUNTERPARTY_NAME") {
        alert("Escribe el nombre del proveedor antes de guardarlo.");
      } else {
        alert("Error al crear forecast. Mira la consola para más detalles.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      position="fixed"
      inset={0}
      bg="rgba(0,0,0,0.5)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex={1000}
    >
      <Box
        bg={useColorModeValue("whiteAlpha.700", "blackAlpha.700")}
        p={6}
        borderRadius="14px"
        w={{ base: "90%", md: 520 }}
      >
        <Text fontSize="xl" fontWeight="bold" mb={4}>Nuevo vencimiento</Text>
        <form onSubmit={handleSubmit(onSubmit)}>
          <VStack spacing={3}>
            <Input
              type="date"
              bg={inputBg}
              color={inputColor}
              _placeholder={{ color: placeholderColor }}
              {...register("date", { required: true })}
            />
            <Select
              bg={inputBg}
              color={inputColor}
              placeholder="Cuenta"
              {...register("account", { required: true })}
            >
              {accounts.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.alias}
                </option>
              ))}
            </Select>
            <Box w="100%">
              <HStack align="stretch">
                <Select
                  bg={inputBg}
                  color={inputColor}
                  placeholder="Proveedor"
                  {...register("counterparty")}
                  isDisabled={isCreatingCounterparty}
                >
                  {counterparties.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
                <Button
                  type="button"
                  bg={buttonSecondaryBg}
                  _hover={{ bg: buttonSecondaryHover }}
                  onClick={() => {
                    setIsCreatingCounterparty((prev) => {
                      const next = !prev;
                      if (!next) {
                        setNewCounterpartyName("");
                      } else {
                        setValue("counterparty", "");
                      }
                      return next;
                    });
                  }}
                >
                  {isCreatingCounterparty ? "Usar existente" : "Nuevo"}
                </Button>
              </HStack>
              {isCreatingCounterparty && (
                <Input
                  mt={2}
                  placeholder="Nombre del proveedor"
                  bg={inputBg}
                  color={inputColor}
                  _placeholder={{ color: placeholderColor }}
                  value={newCounterpartyName}
                  onChange={(e) => setNewCounterpartyName(e.target.value)}
                />
              )}
            </Box>
            <Input
              type="number"
              step="0.01"
              placeholder="Importe"
              bg={inputBg}
              color={inputColor}
              _placeholder={{ color: placeholderColor }}
              {...register("amount", { required: true })}
            />
            <Select
              bg={inputBg}
              color={inputColor}
              {...register("type")}
            >
              <option value="out">Pago</option>
              <option value="in">Cobro</option>
            </Select>
            <Select
              bg={inputBg}
              color={inputColor}
              placeholder="Sin categoría"
              {...register("category")}
            >
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </Select>
            <Input
              placeholder="Concepto"
              bg={inputBg}
              color={inputColor}
              _placeholder={{ color: placeholderColor }}
              {...register("concept")}
            />
          </VStack>

          <HStack mt={4} justifyContent="flex-end" spacing={3}>
            <Button
              type="button"
              bg={buttonSecondaryBg}
              _hover={{ bg: buttonSecondaryHover }}
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              bg={buttonBg}
              color={buttonColor}
              _hover={{ bg: buttonHover }}
              isLoading={isSubmitting}
            >
              Guardar
            </Button>
          </HStack>
        </form>
      </Box>
    </Box>
  );
}
