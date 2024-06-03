"use client";

import * as Yup from "yup";
import type { Schema } from "../../amplify/data/resource";
import {
  Alert,
  Button,
  Card,
  Divider,
  FormLabel,
  Input,
  Slide,
  SlideProps,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import { generateClient } from "aws-amplify/data";
import { useEffect, useState } from "react";
import { FormProvider, useForm, SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  WithAuthenticatorProps,
  withAuthenticator,
} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import outputs from "../../amplify_outputs.json";
import { Amplify } from "aws-amplify";

Amplify.configure(outputs);
const client = generateClient<Schema>({
  authMode: "userPool",
});

const Todo = ({ signOut, user }: WithAuthenticatorProps) => {
  // snackbar
  const [open, setOpen] = useState(false);
  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const transitionRight = (props: SlideProps) => {
    return <Slide {...props} direction="right" />;
  };
  // --------------------

  const [todos, setTodos] = useState<Schema["Todo"]["type"][]>([]);

  const defaultValues = {
    name: "",
    description: "",
  };
  const validationSchema = Yup.object().shape({
    name: Yup.string().required("Name is required"),
    description: Yup.string().required("Description is required"),
  });
  const methods = useForm({
    defaultValues,
    resolver: yupResolver(validationSchema),
  });
  const { handleSubmit, register, resetField, getValues } = methods;

  const fetchTodo = async () => {
    const { data: items } = await client.models.Todo.list({
      authMode: "userPool",
      filter: {
        userId: {
          eq: user?.userId,
        },
      },
    });
    setTodos(items);
  };

  const onSubmit = async ({
    name,
    description,
  }: {
    name: string;
    description: string;
  }) => {
    await client.models.Todo.create(
      {
        userId: user?.userId ?? "",
        name,
        description,
      },
      { authMode: "userPool" }
    );
    resetField("name");
    resetField("description");
    handleClickOpen();
    await fetchTodo();
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      await client.models.Todo.delete({
        id,
      });
      handleClickOpen();
      await fetchTodo();
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchTodo();
  }, []);

  return (
    <main>
      <>
        <Stack spacing={3} m={"2rem 1rem"}>
          <Stack
            direction={"row"}
            gap={2}
            sx={{ justifyContent: "space-between" }}
          >
            <Typography variant="h2">Todo List Sample</Typography>
            <Button variant="contained" onClick={signOut}>
              Sign Out
            </Button>
          </Stack>

          <Divider />

          <Stack spacing={3}>
            <Typography variant="h4">Create Todo</Typography>
            <FormProvider {...methods}>
              <form onSubmit={handleSubmit(onSubmit)}>
                <Card sx={{ py: "1rem", px: "2rem" }}>
                  <Stack spacing={5}>
                    <Stack>
                      <FormLabel htmlFor="name">Name</FormLabel>
                      <Input
                        {...register("name")}
                        placeholder="Your todo name!"
                      />
                    </Stack>

                    <Stack>
                      <FormLabel htmlFor="description">Description</FormLabel>
                      <Input
                        multiline
                        {...register("description")}
                        placeholder="Your todo description!"
                      />
                    </Stack>

                    <Button type="submit" variant="contained">
                      Add
                    </Button>
                  </Stack>
                </Card>
              </form>
            </FormProvider>
          </Stack>

          <Divider />

          <Stack spacing={3}>
            <Typography variant="h3">Todo List</Typography>
            <Stack spacing={3}>
              {todos.map((todo) => (
                <Card key={todo.id} sx={{ py: "1rem", px: "2rem" }}>
                  <Stack>
                    <Typography variant="h6" fontWeight={"bold"}>
                      {todo.name}
                    </Typography>
                    <Typography variant="body1">{todo.description}</Typography>
                  </Stack>

                  <Stack
                    direction={"row"}
                    gap={2}
                    sx={{ justifyContent: "flex-end" }}
                  >
                    <Button
                      variant="contained"
                      onClick={() => {
                        if (typeof todo?.id === "string") {
                          handleDeleteTodo(todo.id);
                        }
                      }}
                    >
                      DONE
                    </Button>
                  </Stack>
                </Card>
              ))}
            </Stack>
          </Stack>
        </Stack>

        <Snackbar
          open={open}
          autoHideDuration={3000}
          onClose={handleClose}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          TransitionComponent={transitionRight}
        >
          <Alert onClose={handleClose} severity="success">
            Success!
          </Alert>
        </Snackbar>
      </>
    </main>
  );
};

export default withAuthenticator(Todo);
